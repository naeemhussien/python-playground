import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def main():
    df = pd.read_csv('/home/shahrin14/mysite/data/iris/iris.data',header=-1)
    col_name = ['sepal_length','sepal_width','petal_length','petal_width','class']
    df.columns = col_name

    print ('\n== Preview data ===========================================\n')
    print (df.head())

    print ('\n== Just get general statistics of the data ================\n')
    print (df.describe())

    print ('\n== Check number of data for each class ====================\n')
    print (df.groupby('class').size())

    print ('\n== Generating Scatter Plot =================================\n')
    dictLabelColor = {'Iris-setosa':'b','Iris-versicolor':'g','Iris-virginica':'r'}
    Y = [dictLabelColor[x] for x in df['class'].tolist()]
    pd.scatter_matrix(df, c=Y, figsize=(10, 10), marker='o', hist_kwds={'bins': 20}, s=60, alpha=.8)

    handles = [plt.plot([],[],color=plt.cm.brg(i/2.), ls="", marker="o", \
                    markersize=np.sqrt(10))[0] for i in range(3)]
    labels=["Iris-setosa", "Iris-versicolor", "Iris-virginica"]
    plt.legend(handles, labels, loc=(1.02,0))

    plt.savefig('/home/shahrin14/mysite/data/iris/pandas-scatter-plot.png')
    print ('Done...')

    print ('\n== Generating Histogram =   ===================================\n')
    df.hist(edgecolor='black',linewidth=1.2,figsize=(12,8))
    plt.savefig('/home/shahrin14/mysite/data/iris/pandas-histogram.png')
    print ('Done...')

if __name__ == "__main__":
    main()