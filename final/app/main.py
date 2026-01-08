from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import cv2
import mediapipe as mp
import numpy as np
import math
from scipy import spatial
import os
import time

app = FastAPI()

# =========================
# SESSION STATE (GLOBAL)
# =========================
SESSION_ACTIVE = False
FRAME_SCORES = []
SESSION_RESULT = None

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# =========================
# UTILITY FUNCTIONS
# =========================

def calculateAngle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle


def dif_compare(x, y):
    avg = []
    for i in range(len(x)):
        result = 1 - spatial.distance.cosine(
            list(x[i].values()),
            list(y[i].values())
        )
        avg.append(result)
    return math.sqrt(2 * (1 - round(sum(avg)/len(avg), 2)))


def diff_compare_angle(x, y):
    diffs = []
    for i in range(len(x)):
        z = abs(x[i] - y[i]) / ((x[i] + y[i]) / 2)
        diffs.append(z)
    return sum(diffs) / len(diffs)


def compare_pose(image, angle_point, angle_user, angle_target):
    h, w, _ = image.shape
    cv2.rectangle(image, (0, 0), (w, 50), (255, 255, 255), -1)

    errors = 0
    for i in range(8):
        if angle_user[i] < angle_target[i] - 15:
            errors += 1
            cv2.circle(
                image,
                (int(angle_point[i][0]*w), int(angle_point[i][1]*h)),
                25,
                (0, 0, 255),
                4
            )

    text = "PERFECT" if errors == 0 else "FIGHTING!"
    cv2.putText(image, text, (170, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

# =========================
# TARGET POSE EXTRACTION
# =========================

TARGET_IMAGE = "assets/Video/yoga25.jpg"

def get_target_pose():
    img = cv2.imread(TARGET_IMAGE)
    if img is None:
        raise FileNotFoundError(f"Target image not found: {TARGET_IMAGE}")

    with mp_pose.Pose(static_image_mode=True) as pose:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        res = pose.process(rgb)
        lm = res.pose_landmarks.landmark

        points = [{'X': p.x, 'Y': p.y, 'Z': p.z} for p in lm]

        angles = [
            int(calculateAngle([lm[12].x,lm[12].y],[lm[14].x,lm[14].y],[lm[16].x,lm[16].y])),
            int(calculateAngle([lm[11].x,lm[11].y],[lm[13].x,lm[13].y],[lm[15].x,lm[15].y])),
            int(calculateAngle([lm[14].x,lm[14].y],[lm[12].x,lm[12].y],[lm[24].x,lm[24].y])),
            int(calculateAngle([lm[13].x,lm[13].y],[lm[11].x,lm[11].y],[lm[23].x,lm[23].y])),
            int(calculateAngle([lm[12].x,lm[12].y],[lm[24].x,lm[24].y],[lm[26].x,lm[26].y])),
            int(calculateAngle([lm[11].x,lm[11].y],[lm[23].x,lm[23].y],[lm[25].x,lm[25].y])),
            int(calculateAngle([lm[24].x,lm[24].y],[lm[26].x,lm[26].y],[lm[28].x,lm[28].y])),
            int(calculateAngle([lm[23].x,lm[23].y],[lm[25].x,lm[25].y],[lm[27].x,lm[27].y]))
        ]

        return points, angles


POINT_TARGET, ANGLE_TARGET = get_target_pose()

# =========================
# VIDEO STREAM GENERATOR
# =========================

def gen_frames(duration):
    global SESSION_ACTIVE, FRAME_SCORES, SESSION_RESULT

    SESSION_ACTIVE = True
    FRAME_SCORES.clear()
    SESSION_RESULT = None

    cap = cv2.VideoCapture(0)
    start_time = time.time()

    with mp_pose.Pose(min_detection_confidence=0.5,
                      min_tracking_confidence=0.5) as pose:

        while time.time() - start_time < duration:
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            image = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark

                keypoints = [{'X': p.x, 'Y': p.y, 'Z': p.z} for p in lm]
                p_score = dif_compare(keypoints, POINT_TARGET)

                angle_point = [
                    [lm[14].x,lm[14].y], [lm[13].x,lm[13].y],
                    [lm[12].x,lm[12].y], [lm[11].x,lm[11].y],
                    [lm[24].x,lm[24].y], [lm[23].x,lm[23].y],
                    [lm[26].x,lm[26].y], [lm[25].x,lm[25].y]
                ]

                angle = [
                    int(calculateAngle(angle_point[2], angle_point[0], [lm[16].x,lm[16].y])),
                    int(calculateAngle(angle_point[3], angle_point[1], [lm[15].x,lm[15].y])),
                    int(calculateAngle(angle_point[0], angle_point[2], angle_point[4])),
                    int(calculateAngle(angle_point[1], angle_point[3], angle_point[5])),
                    int(calculateAngle(angle_point[2], angle_point[4], angle_point[6])),
                    int(calculateAngle(angle_point[3], angle_point[5], angle_point[7])),
                    int(calculateAngle(angle_point[4], angle_point[6], [lm[28].x,lm[28].y])),
                    int(calculateAngle(angle_point[5], angle_point[7], [lm[27].x,lm[27].y]))
                ]

                a_score = diff_compare_angle(angle, ANGLE_TARGET)

                raw_score = max((1 - a_score), (1 - p_score)) * 100
                display_score = max(0, min(100, raw_score))
                FRAME_SCORES.append(display_score)

                compare_pose(image, angle_point, angle, ANGLE_TARGET)

                cv2.putText(image, f"{int(display_score)}",
                            (80, 30), cv2.FONT_HERSHEY_SIMPLEX,
                            1, (0, 0, 255), 2)

                mp_drawing.draw_landmarks(
                    image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            _, buffer = cv2.imencode(".jpg", image)
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" +
                   buffer.tobytes() + b"\r\n")

    cap.release()

    SESSION_RESULT = sum(FRAME_SCORES) / len(FRAME_SCORES) if FRAME_SCORES else 0
    SESSION_ACTIVE = False

# =========================
# API ROUTES
# =========================

@app.get("/video")
def video_feed(duration: int = 10):
    return StreamingResponse(
        gen_frames(duration),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/result")
def get_result():
    if SESSION_ACTIVE:
        return {"status": "running"}

    if SESSION_RESULT is None:
        return {"status": "no_session"}

    return {
        "status": "completed",
        "average_pose_score": round(SESSION_RESULT, 2)
    }
