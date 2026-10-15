#!/usr/bin/env python3
"""Export both surveys from Cloudflare D1 to a local CSV. Requires Wrangler login."""
import csv
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else Path.home() / 'Downloads' / 'survey-responses.csv'
result = subprocess.run(['npx', 'wrangler', 'd1', 'execute', 'survey-responses', '--remote', '--config', str(root / 'worker/wrangler.toml'), '--command', 'SELECT * FROM responses ORDER BY received_at DESC', '--json'], check=True, capture_output=True, text=True)
rows = json.loads(result.stdout)[0]['results']
columns = ['respondent_id', 'game', 'started_at', 'completed_at', 'overall_interest', 'overall_feedback', 'card_id', 'card_title', 'clarity', 'interest', 'comprehension', 'feedback', 'received_at', 'survey_version', 'verdict', 'technical_issues', 'writing_issues', 'properly_formatted', 'field_relevant']
with output.open('w', newline='', encoding='utf-8') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    for row in rows:
        # Protect text fields when the CSV is opened in spreadsheet software.
        writer.writerow({key: "'" + value if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')) else value for key, value in row.items()})
print(f'Exported {len(rows)} responses to {output}')
