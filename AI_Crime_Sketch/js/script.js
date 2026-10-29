
"use strict";

// 1. Connect JavaScript to the HTML elements
const description = document.getElementById("description");
const generateBtn = document.getElementById("generateBtn");
const voiceBtn = document.getElementById("voiceBtn");
const editBtn = document.getElementById("editBtn");
const message = document.getElementById("message");
const featureResults = document.getElementById("featureResults");

const featureElements = {
    faceShape: document.getElementById("faceShape"),
    hair: document.getElementById("hair"),
    eyes: document.getElementById("eyes"),
    eyebrows: document.getElementById("eyebrows"),
    nose: document.getElementById("nose"),
    chin: document.getElementById("chin"),
    facialHair: document.getElementById("facialHair")
};

// 2. Check whether all required HTML elements exist
const requiredElements = [
    description,
    generateBtn,
    voiceBtn,
    editBtn,
    message,
    featureResults,
    ...Object.values(featureElements)
];

if (requiredElements.some(element => element === null)) {
    console.error("Some HTML elements are missing. Check your HTML IDs.");
} else {

    // 3. Send the description to the Python Flask backend
    generateBtn.addEventListener("click", async function () {

        const witnessDescription = description.value.trim();

        if (!witnessDescription) {
            message.textContent =
                "Please enter a witness description first.";
            featureResults.hidden = true;
            description.focus();
            return;
        }

        generateBtn.disabled = true;
        message.textContent = "Analyzing description... Please wait.";
        featureResults.hidden = true;

        try {
            // Connect to the backend API
            const response = await fetch(
                "http://127.0.0.1:5000/api/analyze",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        description: witnessDescription
                    })
                }
            );

            const data = await response.json();

            // Show an error returned by the backend
            if (!response.ok) {
                throw new Error(
                    data.error || "Could not analyze the description."
                );
            }

            // 4. Display the features returned by Python
            for (const key in featureElements) {
                featureElements[key].textContent =
                    data.features?.[key] || "Not identified";
            }

            featureResults.hidden = false;

            message.textContent =
                (data.message || "Analysis completed.") +
                " Please verify the extracted features. " +
                (data.notice || "");

        } catch (error) {
            console.error("Backend connection error:", error);

            message.textContent =
                "Could not connect to the backend. Make sure Flask is running at http://127.0.0.1:5000.";
        } finally {
            generateBtn.disabled = false;
        }
    });

    // 5. Allow the user to edit the description
    editBtn.addEventListener("click", function () {
        description.focus();
        message.textContent =
            "Edit the description, then click Analyze Description again.";
    });

    // 6. Voice input using browser speech recognition
    voiceBtn.addEventListener("click", function () {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            message.textContent =
                "Voice input is unavailable in this browser. Please type your description.";
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        voiceBtn.disabled = true;
        message.textContent =
            "Listening... Describe the observed facial features.";

        recognition.onresult = function (event) {
            const spokenText = event.results[0][0].transcript;

            description.value = description.value.trim()
                ? description.value.trim() + " " + spokenText
                : spokenText;

            message.textContent =
                "Voice description received. Review it, then analyze it.";
        };

        recognition.onerror = function () {
            message.textContent =
                "Voice input failed. Check microphone permission or type your description.";
        };

        recognition.onend = function () {
            voiceBtn.disabled = false;
        };

        try {
            recognition.start();
        } catch (error) {
            voiceBtn.disabled = false;
            message.textContent =
                "Could not start voice input. Please try again.";
            console.error("Voice input error:", error);
        }
    });
}

const generateSketchBtn = document.getElementById("generateSketchBtn");
const sketchResult = document.getElementById("sketchResult");
const sketchImage = document.getElementById("sketchImage");
const sketchNotice = document.getElementById("sketchNotice");

if (generateSketchBtn) {
    generateSketchBtn.addEventListener("click", async function () {
        const witnessDescription =
            document.getElementById("description").value.trim();

        if (!witnessDescription) {
            document.getElementById("message").textContent =
                "Please enter a witness description first.";
            return;
        }

        generateSketchBtn.disabled = true;
        generateSketchBtn.textContent = "Generating sketch...";
        document.getElementById("message").textContent =
            "Requesting an illustrative sketch from Hugging Face. Please wait.";

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/api/generate-sketch",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        description: witnessDescription
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Sketch generation failed."
                );
            }

            sketchImage.src = data.image;
            sketchNotice.textContent = data.notice || "";
            sketchResult.hidden = false;

            document.getElementById("message").textContent =
                "Illustrative sketch generated successfully.";
        } catch (error) {
            console.error("Sketch generation error:", error);

            document.getElementById("message").textContent =
                "Could not generate sketch: " + error.message;
        } finally {
            generateSketchBtn.disabled = false;
            generateSketchBtn.textContent = "Generate AI Sketch";
        }
    });
}
