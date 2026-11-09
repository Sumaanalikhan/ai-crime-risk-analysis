from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import random

app = FastAPI(title="CrimeGuard AI Prediction Engine")

# Allow the Express backend to communicate with this Python API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    location: str
    time: str

# Initialize the Machine Learning Model
ai_model = RandomForestRegressor(n_estimators=100, random_state=42)

# Feature Encoding for Karachi Districts
location_encoded = {
    'LYARI': 3, 'KORANGI': 3, 'ORANGI': 3, 'SADDAR': 3, 'MACHAR COLONY': 3,
    'GULSHAN': 2, 'NAZIMABAD': 2, 'TARIQ ROAD': 2, 'JOHAR': 2, 'MALIR': 2,
    'DHA': 1, 'CLIFTON': 1, 'CANTT': 1, 'BAHRIA': 1
}

@app.on_event("startup")
def train_model():
    print("\n🧠 [AI ENGINE] Booting up and generating training data...")
    
    # 1. Generate Synthetic Training Data (For FYP Demonstration)
    training_data = []
    for loc_name, risk_code in location_encoded.items():
        for hour in range(24):
            # Base logic for the AI to learn from
            base_score = risk_code * 22 
            if hour >= 22 or hour <= 4:
                base_score += 30  # Nighttime spike
            elif hour >= 18 or hour <= 21:
                base_score += 15  # Evening spike
                
            # Inject realistic variance so the ML model has to actually "learn"
            variance = random.randint(-8, 8)
            final_score = max(1, min(100, base_score + variance))
            
            training_data.append({'loc_code': risk_code, 'hour': hour, 'risk_score': final_score})
    
    # 2. Train the Random Forest Model
    print("⏳ [AI ENGINE] Training RandomForestRegressor model...")
    df = pd.DataFrame(training_data)
    X = df[['loc_code', 'hour']]
    y = df['risk_score']
    
    ai_model.fit(X, y)
    print("✅ [AI ENGINE] Model trained successfully! Ready for predictions.\n")

@app.post("/predict")
def predict_risk(req: PredictionRequest):
    # Parse the incoming time to extract the hour
    hour = int(req.time.split(':')[0])
    
    # Match the location string to our encoded feature map
    search_loc = req.location.upper()
    loc_code = 2  # Default to moderate risk (2) if the area is unknown
    
    for key, val in location_encoded.items():
        if key in search_loc:
            loc_code = val
            break
            
    # Ask the trained AI model to predict the score based on its training
    input_features = pd.DataFrame([[loc_code, hour]], columns=['loc_code', 'hour'])
    predicted_score = int(ai_model.predict(input_features)[0])
    
    # Ensure the score stays between 1 and 100
    final_score = max(1, min(100, predicted_score))
    
    return {
        "location": req.location,
        "time": req.time,
        "ai_risk_score": final_score,
        "model_used": "RandomForestRegressor"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)