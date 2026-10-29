import base64
import io
import re
import time
import os
import hmac
import secrets
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session
from flask_cors import CORS

app = Flask(__name__)

# For local development, defaults are provided below. Change them before use.
# For deployment, set FLASK_SECRET_KEY, SKETCH_LOGIN_USERNAME, and
# SKETCH_LOGIN_PASSWORD as environment variables instead of hard-coding secrets.
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("COOKIE_SECURE", "0") == "1"

LOGIN_USERNAME = os.environ.get("SKETCH_LOGIN_USERNAME", "admin")
LOGIN_PASSWORD = os.environ.get("SKETCH_LOGIN_PASSWORD", "SketchMind@2026")

CORS(app, supports_credentials=True)

app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

# The project root is the folder containing welcome.html and index.html.
# This assumes app.py is inside the backend folder.
PROJECT_DIR = Path(__file__).resolve().parent.parent

HORDE_URL = "https://aihorde.net/api/v2"
HORDE_API_KEY = "0000000000"  # Anonymous access; low priority
CLIENT_AGENT = "AI-Crime-Sketch-Generator:1.0"


# --------------------------------------------------
# FACIAL FEATURE EXTRACTION
# --------------------------------------------------

def extract_features(description):
    text = description.lower()

    patterns = {
        "faceShape": {
            "Long": r"\blong face\b",
            "Round": r"\bround face\b",
            "Oval": r"\boval face\b",
            "Square": r"\bsquare face\b",
        },
        "hair": {
            "Short hair": r"\bshort hair\b",
            "Long hair": r"\blong hair\b",
            "Curly hair": r"\bcurly hair\b",
            "Bald": r"\bbald\b",
        },
        "eyes": {
            "Brown": r"\bbrown eyes?\b",
            "Blue": r"\bblue eyes?\b",
            "Black": r"\bblack eyes?\b",
            "Green": r"\bgreen eyes?\b",
        },
        "eyebrows": {
            "Thick": r"\bthick eyebrows?\b",
            "Thin": r"\bthin eyebrows?\b",
        },
        "nose": {
            "Straight": r"\bstraight nose\b",
            "Broad": r"\bbroad nose\b",
            "Pointed": r"\bpointed nose\b",
        },
        "chin": {
            "Narrow": r"\bnarrow chin\b",
            "Broad": r"\bbroad chin\b",
            "Round": r"\bround chin\b",
        },
        "facialHair": {
            "Beard": r"\bbeard\b",
            "Mustache": r"\bmustache\b|\bmoustache\b",
            "Clean-shaven": r"\bclean[- ]shaven\b",
        },
    }

    features = {}

    for feature, choices in patterns.items():
        features[feature] = "Not identified"

        for label, pattern in choices.items():
            if re.search(pattern, text):
                features[feature] = label
                break
