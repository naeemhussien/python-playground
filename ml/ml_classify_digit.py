from sklearn import svm, metrics, model_selection
from numpy import array

def getClassifier():
    return svm.SVC(gamma=0.001, C=100.)
#This function is called from the flask REST API
#that is being called by codepen
def predictDigit(classifier,trained,predictInput,evaluate=True):

    #We assume the classifier has been loaded in a pickle before this.
    #if classifier is None:
    #    classifier = getClassifier()
    #    classifier.fit(trained.data, trained.target)
    predictLabel = classifier.predict(predictInput)
    confusionMatrix = None
    if evaluate:
        #As a method for evaluation, we run an accuracy test on the training data using K Fold
        #kfold = model_selection.KFold(n_splits=2)
        #for train_index, test_index in kfold.split(trained.data):
        #    kfoldClassifier = getClassifier()

        #    X_train, X_test = trained.data[train_index], trained.data[test_index]
        #    y_train, y_test = trained.target[train_index], trained.target[test_index]

        #    kfoldClassifier.fit(X_train, y_train)
        #    confusionMatrix = metrics.confusion_matrix(y_test, kfoldClassifier.predict(X_test))

        #To save CPU, we comment the above and return a saved confusion matrix.
        confusionMatrix = array([
            [87, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 87, 1, 0, 0, 0, 0, 0, 2, 1],
            [0, 0, 85, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 82, 0, 3, 0, 2, 4, 0],
            [0, 0, 0, 0, 88, 0, 0, 0, 0, 4],
            [0, 0, 0, 0, 0, 87, 1, 0, 0, 3],
            [0, 1, 0, 0, 0, 0, 90, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 88, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 87, 0],
            [0, 0, 0, 1, 0, 1, 0, 0, 0, 90]
        ])

    return (classifier,predictLabel,confusionMatrix)

#The following demonstrates how the above function should be used
def main():
    from sklearn import datasets
    digits = datasets.load_digits()
    trained = lambda: None
    trained.data = digits.data #[:-2]
    trained.target = digits.target #[:-2]
    predictInput = digits.data #[-2:].tolist()

    classifier = getClassifier()
    classifier.fit(trained.data, trained.target)
    (classifier,predictLabel,confusionMatrix) = predictDigit(classifier,trained,predictInput,True)
    data = {}
    data["input"] = predictInput
    data["label"] = predictLabel.tolist()
    data["confusionMatrix"] = confusionMatrix.tolist()

    print(data)

    import pickle
    pickle.dump( classifier, open( "ml_classify_digit-trained_classifier.pkl", "wb" ) )

if __name__ == "__main__":
    main()