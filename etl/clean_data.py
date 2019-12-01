import googlemaps as googlemaps
import pandas as pd
import os
import sys
import numpy as np
import re
from datetime import datetime, date
import matplotlib
import googlemaps

# Take two locations and return their lat,lon
# Directions Client
def get_gmap_key():
    with open("environment.txt") as f:
        k, v = f.read().split("=")
    return v.strip()
gmaps = googlemaps.Client(key=get_gmap_key())

def get_latlon(location):
    try:
        results = gmaps.geocode(location)
        bounds = results[0]['geometry']['bounds']
        lat = np.mean([bounds['northeast']['lat'], bounds['southwest']['lat']])
        lng = np.mean([bounds['northeast']['lng'], bounds['southwest']['lng']])
        return (lng, lat)
    except:
        return (0,0)


def clean_forex(df):
    df['year'] = df['DATE'].str.slice(0,4).map(int)
    df['rate'] = df.iloc[:, 1]
    return df.loc[:, ['year', 'rate']]

def clean_inflation(df):
    df['year'] = df['date'].str.slice(-5,-1).map(int)
    df['rate_num'] = df['rate'].map(lambda x: float(x.rstrip("%")) / 100 + 1)
    df = df.sort_values("year")
    df['index'] = df['rate_num'].cumprod()
    rate_2019 = float(df.loc[df.year == 2019, 'index'])
    df['index'] = df['index'] / rate_2019
    return df.loc[:, ['year', 'index']]

# Load data
aud = clean_forex(pd.read_csv("raw/forex/aud.csv"))
eur = clean_forex(pd.read_csv("raw/forex/eur.csv"))
gbp = clean_forex(pd.read_csv("raw/forex/gbp.csv"))
inflation = clean_inflation(pd.read_csv("raw/forex/inflation.tsv", sep="\t"))

def load_raw_data():
    df = pd.DataFrame({})
    years = os.listdir("raw/")
    for year in years:
        data_files = os.listdir("raw/" + year)
        for file in data_files:
            try:
                tourney, location, date, surface, money = file.rstrip(".csv").split("|")
                temp = pd.read_csv("raw/" + year + "/" + file)
                temp['tourney'] = tourney
                temp['location'] = location
                temp['date'] = date
                temp['surface'] = surface
                temp['money'] = money
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
    df = df[df['year'] > 1975]
    return df


def make_player_scores(df):

    winners = df.groupby("winner").day.count().reset_index() \
        .rename(columns={"winner": "player", "day": "wins"})
    losers = df.groupby("loser").day.count().reset_index() \
        .rename(columns={"loser": "player", "day": "losses"})
    player_scores = pd.merge(winners, losers, on="player", how="outer") \
        .fillna(0)
    player_scores['matches'] = player_scores['wins'] + player_scores['losses']
    player_scores = player_scores[player_scores['matches'] > 100]
    return player_scores


def make_player_scores_by_year(df, unique_players):

    # Winners
    winners = df.groupby(["winner", "year"]).day.count().reset_index() \
        .rename(columns={"winner": "player", "day": "wins"})
    winners = winners[winners['player'].isin(unique_players)]

    # Losers
    losers = df.groupby(["loser", "year"]).day.count().reset_index() \
        .rename(columns={"loser": "player", "day": "losses"})
    losers = losers[losers['player'].isin(unique_players)]

    # Merge
    player_scores = pd.merge(winners, losers, on=["player", "year"], how="outer") \
        .fillna(0)
    player_scores['wins'] = player_scores['wins'].astype(int)
    player_scores['losses'] = player_scores['losses'].astype(int)
    player_scores['year'] = player_scores['year'].astype(int)
    return player_scores

# Convert to USD and at 2019 levels
def convert_currency(amount, from_currency, year):
    # Convert currency
    if from_currency == "A":
        rate = aud.loc[aud['year'] == year, "rate"]
    elif from_currency == "€":
        rate = eur.loc[eur['year'] == year, "rate"]
    elif from_currency == "£":
        rate = gbp.loc[gbp['year'] == year, "rate"]
    elif from_currency == "$":
        rate = 1
    else:
        return -1        # Error
    rate = float(rate)

    # Get inflation Rate
    inflation_index = float(inflation[inflation['year'] == year]['index'])

    # Convert year to date
    tourney_date = date(year, 1, 1)

    # Convert string to numeric
    amount = int(re.sub('[^0-9]', '', amount))

    # Convert to USD
    converted_amount = amount / rate / inflation_index
    return round(converted_amount)

def make_location_dictionary(df):
    unique_locations = df.location.unique().tolist()
    location_dict = {}
    for location in unique_locations:
        location_dict[location] = get_latlon(location)
    location_df = pd.DataFrame.from_dict(location_dict, orient='index').reset_index()
    location_df.columns = ['location', 'lng', 'lat']
    location_df = location_df[~((location_df['lng'] == 0) & (location_df['lat'] == 0))]
    location_df.to_csv("clean/locations.csv", index=False)

def impute_lonlat(df):
    locations = pd.read_csv("clean/locations.csv")
    df = pd.merge(df, locations, on=["location"], how="left")
    return df

def make_tournaments(df):
    tournaments = df.loc[:, ['year', 'tourney', 'location', 'surface', 'money']].drop_duplicates().dropna()
    tournaments = impute_lonlat(tournaments)
    tournaments['currency'] = tournaments.money.str.slice(0, 1)
    tournaments['money'] = tournaments.apply(lambda row: \
        convert_currency(row['money'], row['currency'], row['year']), axis=1)
    columns_keep = ['tourney', 'year', 'location', 'lng', 'lat', 'surface', 'money']
    return tournaments.loc[:, columns_keep].reset_index(drop=True)


if __name__ == '__main__':

    # Intermediate file
    df = load_raw_data()
    df = clean_raw_data(df)
    df.to_csv("clean/data.csv", index=False)

    # Scatterplot
    df = pd.read_csv("clean/data.csv").dropna()
    df['year'] = df['year'].astype(int)
    player_scores = make_player_scores(df)
    unique_players = player_scores.player.tolist()
    player_scores_by_year = make_player_scores_by_year(df, unique_players)
    player_scores_by_year.to_csv("final/player_scores_by_year.csv", index=False)

    # Surface Prize Money
    tournaments = make_tournaments(df)
    surfaces = tournaments.groupby(['year', 'surface']).agg({"money": "sum"}).reset_index()
    surfaces['money'] = surfaces['money'].map(lambda x: round(x / 100000) * 100000)
    surfaces.to_csv("final/surfaces.csv", index=False)

    # Tournaments (with geolocation)
    tournaments = tournaments.dropna()
    tournaments.to_csv("final/tournaments.csv", index=False)
