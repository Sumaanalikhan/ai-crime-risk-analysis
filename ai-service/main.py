from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="CrimeGuard AI Prediction Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    location: str
    time: str

ai_model = RandomForestRegressor(n_estimators=100, random_state=42)
area_mapping = {}
heatmap_cache = []

@app.on_event("startup")
def train_model():
    global area_mapping, heatmap_cache
    print("\n🧠 [AI ENGINE] Booting up and loading real dataset...")

    file_path = 'karachi_crime_dataset_final.csv'
    if not os.path.exists(file_path):
        print(f"❌ ERROR: Cannot find {file_path} in the ai-service folder!")
        return

    df = pd.read_csv(file_path)

    # 1. Build town-to-code lookup for predictions
    unique_areas = df[['town', 'area_code']].drop_duplicates()
    area_mapping = dict(zip(unique_areas['town'].str.upper(), unique_areas['area_code']))

    # 2. Pre-aggregate 60,000 rows into 35 district summaries for fast map rendering
    grouped = df.groupby(['area_code', 'town']).agg(
        lat=('latitude', 'mean'),
        lng=('longitude', 'mean'),
        incidents=('incident_id', 'count'),
        avg_risk=('risk_score', 'mean'),
        dominant_level=('area_risk_level', lambda x: x.mode()[0]),
        top_crime=('crime_type', lambda x: x.mode()[0])
    ).reset_index()

    level_map = {'High': 'High', 'Medium': 'Moderate', 'Low': 'Low'}
    heatmap_cache = [
        {
            "id": int(row['area_code']),
            "name": row['town'],
            "lat": round(float(row['lat']), 5),
            "lng": round(float(row['lng']), 5),
            "risk": level_map.get(row['dominant_level'], 'Moderate'),
            "type": row['top_crime'],
            "incidents": int(row['incidents']),
            "avgScore": round(float(row['avg_risk']) * 10, 1),
            "radius": max(10, min(32, int(row['avg_risk'] * 3.5)))
        }
        for _, row in grouped.iterrows()
    ]

    print(f"📊 [AI ENGINE] Aggregated {len(df)} records into {len(heatmap_cache)} Karachi districts.")
    print("⏳ [AI ENGINE] Training RandomForestRegressor model on real data...")

    # 3. Train Random Forest model
    X = df[['area_code', 'hour']]
    y = df['risk_score']
    ai_model.fit(X, y)
    print("✅ [AI ENGINE] Model trained successfully! Ready for live predictions.\n")

@app.get("/heatmap-data")
def get_heatmap_data():
    return {"zones": heatmap_cache}

@app.post("/predict")
def predict_risk(req: PredictionRequest):
    hour = int(req.time.split(':')[0])
    search_loc = req.location.upper()

    loc_code = 17  # Default to Saddar if not matched
    for town_name, code in area_mapping.items():
        if town_name in search_loc or search_loc in town_name:
            loc_code = code
            break

    input_features = pd.DataFrame([[loc_code, hour]], columns=['area_code', 'hour'])
    predicted_score = float(ai_model.predict(input_features)[0])
    final_score = int(max(1, min(100, predicted_score * 10)))

    return {
        "location": req.location,
        "time": req.time,
        "ai_risk_score": final_score,
        "model_used": "RandomForestRegressor (Trained on karachi_crime_dataset_final.csv)"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)