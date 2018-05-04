
# A REST API that calls the respective machine learning library
import os, sys, pickle
sys.path.append("python-playground/ml")


from flask import Flask, json, request, send_from_directory, redirect

from ml_classify_digit import predictDigit
from ml_predict_enron_bonus import getEnronDatasetAsList, predictEnronBonus

from sklearn import datasets

app = Flask(__name__)
app.secret_key = os.urandom(24)

def getResponse(data):
    return app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json',
        headers={
            'Access-Control-Allow-Origin' : '*'
        }
    )
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT'
        headers = request.headers.get('Access-Control-Request-Headers')
        if headers:
            response.headers['Access-Control-Allow-Headers'] = headers
    return response

app.after_request(add_cors_headers)

@app.route('/')
def root():
    return "OK!"

#Serve static pages here
@app.route('/pages/<path:path>')
def send_static(path):
    if os.path.isdir('python-playground/pages/'+path):
        if not path.endswith('/'):
            return redirect('/pages/' + path + '/')
        path += "index.html"
    return send_from_directory('pages', path)

@app.route('/data/<path:path>')
def send_static_data(path):
    if os.path.isdir('python-playground/data/'+path):
        if not path.endswith('/'):
            return redirect('/data/' + path + '/')
        path += "index.html"
    return send_from_directory('data', path)
    
@app.route('/echo')
def echo():
    data = {}
    data["args"] = request.args.to_dict()
    data["message"] = "Echo successful"
    return getResponse(data)

@app.route('/getDigitDataset')
def getDigitDataset():
    digits = datasets.load_digits()
    data = {}
    data["data"] = digits.data.tolist()
    data["target"] = digits.target.tolist()
    return getResponse(data)

@app.route('/predictDigit')
def mlPredictDigit():
    classifier = pickle.load( open("python-playground/ml/ml_classify_digit-trained_classifier.pkl", "rb"))
    digits = datasets.load_digits()
    trained = digits
    predictInput = json.loads(request.args.to_dict()["input"])
    predictLabel = []
    (classifier,predictLabel,confusionMatrix) = predictDigit(classifier,trained,predictInput)
    #session["ml_classify_digit"] = pickle.dumps(classifier)
    print (predictLabel)
    data = {}
    data["input"] = predictInput
    data["label"] = predictLabel.tolist()
    data["confusionMatrix"] = confusionMatrix.tolist()

    return getResponse(data)

@app.route('/predictEnronBonus')
def mlPredictEnronBonus():
    regression = None

    outlierNumber = json.loads(request.args.to_dict()["outlierNumber"])

    trained = getEnronDatasetAsList(pickle.load( open("python-playground/data/enron/enron_salary_and_bonus.pkl", "rb")))
    (regression,predict,outlier) = predictEnronBonus(trained,outlierNumber)
    data = {}
    data["trained"] = trained
    data["predict"] = predict
    data["outlier"] = outlier
    return getResponse(data)
