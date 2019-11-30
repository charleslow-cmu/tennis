import pandas as pd
import os
import sys
import numpy as np

def load_raw_data():
    data_files = os.listdir("raw/")
    df = pd.DataFrame({})
    for file in data_files:
        try:
            tourney, location, date = file.rstrip(".csv").split("|")
            temp = pd.read_csv("raw/" + file)
            temp['tourney'] = tourney
            temp['location'] = location
            temp['date'] = date
            df = df.append(temp, ignore_index=True)
        except:
            continue
    return df

def safe_int(string):
    try:
        integer = int(string)
    except:
        integer = None
    return integer

def clean_raw_data(df):
    # Get location
    df['location'] = df['location'].map(lambda x: x.rstrip(","))

    # Get date
    temp = df['date'].str.split(" - ", expand=True)
    df['date'] = temp[0]
    temp = df['date'].str.split(".", expand=True)
    df['year'] = temp[0].map(safe_int)
    df['month'] = temp[1].map(safe_int)
    df['day'] = temp[2].map(safe_int)
    return df

if __name__ == '__main__':
    df = load_raw_data()
    df = clean_raw_data(df)

    df.to_csv("cleaned/data.csv", index=False)
