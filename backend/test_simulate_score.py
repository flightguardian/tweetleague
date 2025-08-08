#!/usr/bin/env python3
"""
Test script to simulate fixture scores
Usage: python test_simulate_score.py
"""

import requests
import json

# Configuration
API_URL = "http://localhost:8000/api"  # Change to production URL if needed
ADMIN_TOKEN = "YOUR_ADMIN_TOKEN_HERE"  # Replace with your admin JWT token

def simulate_score(fixture_id, home_score, away_score):
    """Simulate a score for a fixture"""
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "home_score": home_score,
        "away_score": away_score
    }
    
    response = requests.post(
        f"{API_URL}/admin/test/simulate-score/{fixture_id}",
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Score simulated successfully!")
        print(f"   Fixture: {result['fixture']['home_team']} vs {result['fixture']['away_team']}")
        print(f"   Score: {result['fixture']['simulated_score']}")
        print(f"   Predictions processed: {result['predictions_processed']}")
        print(f"   Exact scores: {result['total_exact_scores']}")
        print(f"   Correct results: {result['total_correct_results']}")
        print("\n   User results:")
        for r in result['results']:
            print(f"   - {r['username']}: predicted {r['prediction']}, earned {r['points']} points")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
    
    return response.status_code == 200

def undo_score(fixture_id):
    """Undo a simulated score"""
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{API_URL}/admin/test/undo-score/{fixture_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Score simulation undone!")
        print(f"   Fixture: {result['fixture']['home_team']} vs {result['fixture']['away_team']}")
        print(f"   Status: {result['fixture']['status']}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
    
    return response.status_code == 200

def get_next_home_fixture():
    """Get the next home fixture for Coventry"""
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{API_URL}/fixtures/next",
        headers=headers
    )
    
    if response.status_code == 200:
        fixtures = response.json()
        for fixture in fixtures:
            if fixture.get('home_team') == 'Coventry City':
                return fixture
    return None

if __name__ == "__main__":
    print("🏟️  Tweet League Score Simulator")
    print("=" * 40)
    
    # Example usage:
    # 1. Find next home fixture
    # next_fixture = get_next_home_fixture()
    # if next_fixture:
    #     fixture_id = next_fixture['id']
    #     print(f"Next home fixture: {next_fixture['home_team']} vs {next_fixture['away_team']} (ID: {fixture_id})")
    # else:
    #     print("No upcoming home fixtures found")
    
    # 2. Simulate a score (replace with actual fixture ID)
    fixture_id = 1  # Replace with actual fixture ID
    home_score = 2
    away_score = 1
    
    print(f"\n📊 Simulating score for fixture {fixture_id}: {home_score}-{away_score}")
    if simulate_score(fixture_id, home_score, away_score):
        print("\n⏸️  Press Enter to undo the simulation...")
        input()
        
        print("\n🔄 Undoing simulation...")
        undo_score(fixture_id)
    
    print("\n✨ Done!")