#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/eokafor/Library/Python/3.9/lib/python/site-packages')

import pandas as pd
import os
import json

# Read the Excel file
file_path = os.path.expanduser('~/Downloads/IRPA CCI Model.xlsx')
xls = pd.ExcelFile(file_path)

# Print all sheet names
print('=== EXCEL SHEETS FOUND ===')
for i, sheet in enumerate(xls.sheet_names, 1):
    print(f'{i}. {sheet}')
print()

# Store all data
all_data = {}

# Read each sheet
for sheet_name in xls.sheet_names:
    print(f'\n=== SHEET: {sheet_name} ===')
    df = pd.read_excel(xls, sheet_name=sheet_name)
    print(f'Dimensions: {df.shape[0]} rows × {df.shape[1]} columns')
    
    # Print column names
    print('\nColumns:')
    for col in df.columns:
        print(f'  - {col}')
    
    # Show all data for analysis
    print(f'\nFull data from {sheet_name}:')
    print('-' * 60)
    
    # Convert to dict for better viewing
    data_dict = df.to_dict('records')
    all_data[sheet_name] = data_dict
    
    # Print each row
    for i, row in enumerate(data_dict[:10], 1):  # First 10 rows
        print(f'\nRow {i}:')
        for key, value in row.items():
            if pd.notna(value):
                print(f'  {key}: {value}')
    
    if len(data_dict) > 10:
        print(f'\n... and {len(data_dict) - 10} more rows')
    
    print('=' * 80)

# Save to JSON for easier analysis
output_file = '/Users/eokafor/toluai/irpa_specs.json'
with open(output_file, 'w') as f:
    # Convert any numpy/pandas types to Python types
    def convert(obj):
        if pd.isna(obj):
            return None
        elif hasattr(obj, 'item'):
            return obj.item()
        elif hasattr(obj, 'tolist'):
            return obj.tolist()
        else:
            return obj
    
    clean_data = {}
    for sheet, data in all_data.items():
        clean_data[sheet] = []
        for row in data:
            clean_row = {k: convert(v) for k, v in row.items()}
            clean_data[sheet].append(clean_row)
    
    json.dump(clean_data, f, indent=2)
    print(f'\nData saved to {output_file}')