from selenium import webdriver
import pandas as pd
from multiprocessing import Pool
import traceback
import os

CHROME_DRIVER_PATH = "/home/charles/chromedriver"


# Convenience Function to set the root project folder
def set_project_directory():
    current_file_path = os.path.abspath(__file__)

    # Get root folder
    while True:
        current_dir = os.path.dirname(current_file_path)
        if current_dir.split("/")[-1] == "tennis":
            break
        else:
            current_file_path = current_dir

    # Change to root
    os.chdir(current_dir)


# Get Court Surface
def get_court_surface(driver):
    detailsList = driver.find_elements_by_class_name("tourney-details")
    for detail in detailsList:
        detailClass = detail.get_attribute("class")
        if detailClass == "tourney-details":
            try:
                image = detail.find_element_by_class_name("icon-court")
                tourneySurface = detail.get_attribute("innerText")
                return tourneySurface
            except:
                pass
    return ""


# Get Prize Money
def get_prize_money(driver):
    tourneyMoney = driver.find_element_by_css_selector("[class='tourney-details prize-money']") \
        .find_element_by_css_selector("[class='item-value']") \
        .get_attribute("innerText") \
        .strip()
    return tourneyMoney


# Get Tourney Details
# Loop until get all the results
def get_tourney_details(driver, url):

    # Initialize
    tourneyTitle, tourneyLocation, tourneyDates, tourneySurface, tourneyMoney = [""] * 5
    i = 0
    while True:
        try:
            tourneyTitle = driver.find_element_by_class_name("tourney-title").get_attribute("innerText")
            tourneyLocation = driver.find_element_by_class_name("tourney-location").get_attribute("innerText")
            tourneyDates = driver.find_element_by_class_name("tourney-dates").get_attribute("innerText")
            tourneySurface = get_court_surface(driver)
            tourneyMoney = get_prize_money(driver)
        except:
            pass

        if tourneyTitle == "" or tourneyLocation == "" or tourneyDates == "" \
                or tourneySurface == "" or tourneyMoney == "":
            driver.implicitly_wait(5)
            i += 1

            # If loop too many times
            if i > 2:
                print("get_tourney_details Exception for: {}".format(url))
                break
        else:
            # string = "Title:" + tourneyTitle + "|Location:" + \
            #          tourneyLocation + "|Date:" + tourneyDates + \
            #          "|Surface:" + tourneySurface + "|Money:" + tourneyMoney
            # print(string)  # Successfully Parsed
            break
    return tourneyTitle, tourneyLocation, tourneyDates, tourneySurface, tourneyMoney


# Get table of Scores
def get_scores_dataframe(driver, url):
    winner_list = []
    loser_list = []
    try:
        scoresTable = driver.find_element_by_class_name("scores-results-content")
        scores = scoresTable.find_elements_by_css_selector("tr")
        for scoreRow in scores:
            names = scoreRow.find_elements_by_class_name("day-table-name")
            if (len(names) == 0):
                continue
            else:
                winner = names[0].get_property("innerText")
                winner_list.append(winner)
                loser = names[1].get_property("innerText")
                loser_list.append(loser)
                # print("{} DEFEAT {}".format(winner,loser))
    except:
        print("get_score Exception for: {}".format(url))

    df = pd.DataFrame({"winner":winner_list, "loser":loser_list})
    return(df)

def get_tourney_results(url, yr):
    # Start up
    options = webdriver.ChromeOptions()
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--incognito')
    options.add_argument('--headless')
    driver = webdriver.Chrome(CHROME_DRIVER_PATH, options=options)
    driver.implicitly_wait(10)

    try:
    # Get Tourney details
        driver.get(url)
        driver.implicitly_wait(20)
        tourneyTitle, tourneyLocation, tourneyDates, tourneySurface, tourneyMoney = get_tourney_details(driver, url)

        # Get Scores
        df = get_scores_dataframe(driver, url)

        # Save to file
        file_name = tourneyTitle + "|" + tourneyLocation + "|" + tourneyDates + \
            "|" + tourneySurface + "|" + tourneyMoney + ".csv"
        file_name = file_name.replace("/", "-")
        df.to_csv("raw/" + yr + "/" + file_name, index=False)
        print("Saved {}: {} entries".format(file_name, df.shape[0]))
        driver.close()
    except:
        driver.close()


def navigate_to_yr(driver, yr):
    # Go to year
    dropDown = driver.find_element_by_class_name("dropdown-label")
    dropDown.click()
    driver.implicitly_wait(1)
    dropDownTable = driver.find_element_by_id("resultsArchiveYearDropdown")
    css_input = "[data-value='{}']".format(yr)
    currentYearList = dropDownTable.find_elements_by_css_selector(css_input)
    for currentYear in currentYearList:
        if currentYear.get_attribute("class") == "dropdown-default-label":
            continue
        else:
            currentYear.click()
    goButton = driver.find_element_by_class_name("filter-submit")
    goButton.click()
    driver.implicitly_wait(5)
    return driver


def get_urls(driver ,yr):
    # Get results for year
    results = driver.find_elements_by_class_name("tourney-result")
    print("Getting for Year {}: {} tournaments".format(yr, len(results)))
    data_tuples = []
    for element in results:
        details = element.find_elements_by_class_name("tourney-details")
        url = details[-1].find_element_by_class_name("button-border").get_attribute("href")
        data_tuples.append((url, yr))
    return data_tuples


def make_directory(directory_name):
    if not os.path.isdir(directory_name):
        os.mkdir(directory_name)


def scrape_data(sleepTime=10, dump=False):
    print('SCRAPING DATA')
    print('You should see an incognito Chrome window appear.')
    print('Click on and focus that window while the scraping process is running.')
    print('Please do not do anything else your computer until the scrape is complete.')
    print('It also helps to fullscreen the window as it loads more cards.')
    sleepTime = 10
    options = webdriver.ChromeOptions()
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--incognito')
    options.add_argument('--headless')
    driver = webdriver.Chrome(CHROME_DRIVER_PATH, options=options)
    driver.implicitly_wait(sleepTime)

    # Go to main page
    driver.get("https://www.atptour.com/en/scores/results-archive")
    driver.implicitly_wait(sleepTime)

    try:
        for yr in range(2009, 1949, -1):

            # Make Directory for raw data
            yr = str(yr)
            make_directory("raw/" + yr)

            # Navigate to the year page
            navigate_to_yr(driver, yr)

            # Get the urls for each tournament in the year
            data_tuples = get_urls(driver, yr)

            # Spawn threads
            p = Pool(5)
            p.starmap(get_tourney_results, data_tuples)

        # Close Driver
        driver.close()

    except Exception:
        traceback.print_exc()
        driver.close()

if __name__=="__main__":
    set_project_directory()
    scrape_data(sleepTime=10)

    # url = "https://www.atptour.com/en/scores/archive/doha/451/2011/results"
    # get_tourney_results(url, "2011")
