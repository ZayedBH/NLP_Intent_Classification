# Zayed, read this before declaring “bro it’s not working” 😂

Welcome to IntentLab. It classifies user intent. Your current intent is probably **get_it_running_without_reading_anything**. Unfortunately, that one did not make the dataset.

## 1. Extract the ZIP

Right-click → Extract All. Open the extracted `IntentLab` folder.

Do not run it from inside the ZIP. The ZIP is luggage, not a computer.

If the email arrives in two parts, extract **IntentLab_Source_and_Model.zip** and **IntentLab_Original_Dataset.zip** into the SAME parent folder. Both contain an `IntentLab` folder; merge those folders. The second archive adds `IntentLab/data/raw/bitext.csv` for retraining. The website itself already has a saved model and runs from the source archive.

## 2. Install the two things it needs

- **Node.js 22 LTS** from https://nodejs.org/
- **Python 3.12** from https://www.python.org/downloads/

On Windows, tick **Add Python to PATH** during installation. This checkbox has ended more friendships than group projects.

Close and reopen the terminal after installing. Check:

```powershell
node --version
python --version
```

If those commands do not print version numbers, the classifier cannot classify your way out of this. Fix the installation first.

## 3. Open a terminal IN the project folder

Open the `IntentLab` folder in File Explorer, click the address bar, type `powershell`, and press Enter. The folder should contain `package.json` and `README.md`.

Then run these commands one at a time:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
npm ci
```

Let each command finish. Installation progress is not a countdown to when you should close the window.

## 4. Run the API

In that terminal:

```powershell
.venv\Scripts\python.exe scripts/dev_server.py
```

Wait for **IntentLab API ready**. Leave this terminal open.

## 5. Run the website

Open a SECOND PowerShell terminal in the same folder:

```powershell
npx vite --host 127.0.0.1
```

Open the Local URL Vite prints, normally **http://127.0.0.1:5173/**.

Two terminals. One is the brain, one is the face. Closing the brain and asking why the face cannot think is… a choice.

## 6. Actually try it

1. Click **Analyze intent** on the sample message.
2. Try the refund and account examples.
3. Open **Why this intent?** and **NLP pipeline**.
4. Try “Tell me about black holes in the universe.” It should ask for clarification.
5. Open **Batch analysis**, enter one message per line, analyze and export.
6. Open **Model insights** to see the measured comparison and confusion matrix.

Do not double-click `index.html`. This is an app with a Python API, not a school HTML practical from 2017.

## 7. Deploy YOUR copy to Vercel

Follow the numbered steps in `README.md`. Upload the SOURCE folder to GitHub, then import that repository in Vercel using the Vite preset.

Keep `models/`, `intentlab/`, `api/`, `public/`, `requirements.txt`, `.python-version`, `package-lock.json`, and `vercel.json`. Deleting the model to “clean the folder” is like removing the engine to make a car lighter.

The local URL works only on the computer running the app. Sending `localhost` to your teacher does not teleport your laptop into her browser.

## Emergency “bro it’s broken” checklist

| What happened? | What to do |
| --- | --- |
| `python` or `node` is not recognized | Finish installation, check PATH, reopen the terminal. |
| `ModuleNotFoundError` | Install requirements with the `.venv\Scripts\python.exe` command above. |
| The page opens but classifier is offline | Keep the Python API terminal running on port 8000. |
| `package.json` cannot be found | You opened the terminal in the wrong folder. Read step 3 with your eyes this time. |
| A port is already in use | Use the existing IntentLab server, or stop your earlier copy with Ctrl+C before restarting. |
| You closed both terminals | Congratulations, you stopped the app. Repeat steps 4 and 5. |
| Predictions look wrong | This is an eight-intent English model. Try one clear support request. Read the limitations. |

## Before the viva

Read `docs/DEMO_AND_VIVA.md`. Be able to explain tokenization, TF-IDF, train/validation/test splits, Naive Bayes and macro F1.

And please: **99.62% on a synthetic test subset does not mean “it understands all English with 99.62% accuracy.”** If you say that, the model’s next intent prediction will be **professor_followup_question**.

Friendly roasting ends here. You’ve got the project; now understand it and make it yours.
