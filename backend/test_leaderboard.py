import requests

# Test the leaderboard endpoint
response = requests.get('https://tweetleague.onrender.com/api/leaderboard/?limit=10')
print(f'Status Code: {response.status_code}')

if response.status_code == 200:
    data = response.json()
    print(f'Returned {len(data)} entries')
    
    if data:
        print(f'\nFirst 3 entries:')
        for i, entry in enumerate(data[:3]):
            print(f'  Position {entry.get("position")}: {entry.get("username")} - {entry.get("total_points")} pts')
        
        # Check for tied positions
        positions = [entry.get('position') for entry in data]
        unique_positions = set(positions)
        
        if len(positions) != len(unique_positions):
            print('\nFound tied positions!')
            # Find which positions are tied
            from collections import Counter
            position_counts = Counter(positions)
            tied = [pos for pos, count in position_counts.items() if count > 1]
            print(f'Tied positions: {tied}')
        else:
            print('\nNo tied positions in this batch')
else:
    print(f'Error: {response.text[:500]}')

# Test user position endpoint (would need auth token)
print('\n--- Testing count endpoint ---')
count_response = requests.get('https://tweetleague.onrender.com/api/leaderboard/count')
if count_response.status_code == 200:
    print(f'Total users in leaderboard: {count_response.json().get("count")}')