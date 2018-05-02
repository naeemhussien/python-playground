import pickle
from sklearn.linear_model import LinearRegression

def getEnronDatasetAsList(dataset):
    datasetList = []
    del dataset["FREVERT MARK A"]
    for person, detail in dataset.items():
        if (detail["salary"] == 'NaN') or (detail["bonus"] == 'NaN'):
            continue
        data = {}
        data["name"] = person
        data["salary"] = detail["salary"]
        data["bonus"] = detail["bonus"]
        datasetList.append(data)

    return datasetList

def removeOutliers(trainedList,predictList,key,number):
    if number == 0:
        return ([],predictList)
    varianceSquared = []
    for index, trainedData in enumerate(trainedList):
        data = trainedData.copy()
        data["varianceSquared"] = (predictList[index][key]-trainedList[index][key]) ** 2
        varianceSquared.append(data)

    varianceSquared = sorted(varianceSquared, key=lambda d: d['varianceSquared'], reverse=True)
    outlierList = varianceSquared[:number]
    trainedList = varianceSquared[number:]
    return (outlierList,trainedList)

def predictEnronBonus(trainedList,outlierNumber):
    regression = LinearRegression()
    xTrained = [[d['salary']] for d in trainedList]
    yTrained = [[d['bonus']]  for d in trainedList]

    regression.fit(xTrained,yTrained)

    yPredict = regression.predict(xTrained)

    predictList = []
    for index, trainedData in enumerate(trainedList):
        predictData = trainedData.copy()
        predictData["salary"] = xTrained[index][0]
        predictData["bonus"] = yPredict[index][0]
        predictList.append(predictData)

    if outlierNumber == 0:
        return (regression,predictList,[])

    (outlierList,trainedListFiltered) = removeOutliers(trainedList,predictList,'bonus',outlierNumber)

    xTrainedFiltered = [[d['salary']] for d in trainedListFiltered]
    yTrainedFiltered = [[d['bonus']]  for d in trainedListFiltered]

    regression = LinearRegression()
    regression.fit(xTrainedFiltered,yTrainedFiltered)

    yPredict = regression.predict(xTrained)

    predictList = []
    for index, trainedData in enumerate(trainedList):
        predictData = trainedData.copy()
        predictData["salary"] = xTrained[index][0]
        predictData["bonus"] = yPredict[index][0]
        predictList.append(predictData)

    return (regression,predictList,outlierList)

def main():
    trained = getEnronDatasetAsList(pickle.load( open("data/enron/enron_salary_and_bonus.pkl", "rb")))
    (regression,predict,outlier) = predictEnronBonus(trained,5)
    data = {}
    data["trained"] = trained
    data["predict"] = predict
    data["outlier"] = outlier
    print (len(trained))
    print (len(predict))
    print (len(outlier))

if __name__ == "__main__":
    main()
