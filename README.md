# Per diems analysis analysis

## Why did we do this?

Does the U.S. pay out way more in per diem rates than other countries and institutions? We sought to answer that question.

## Who did this?

This is a product of the Center for Public Integrity's data team. It was created by Chris Zubak-Skees and informed by Tik Root.

## What's here?

* [Analysis](analysis.ipynb) — Descriptive analysis of the results.

## How did we do it?

The notebook was developed on MacOS 10.13.4 with `git`, `node`, `yarn`, `pipenv` and Python 3 installed. These instructions are specific to that environment, but should be adaptable to others:

```sh
git clone https://github.com/PublicI/per-diems.git
cd per-diems
# to run the data cleaning/processing
yarn
chmod +x process.sh
./process.sh
# to run the Jupyter analysis notebook
pipenv install
pipenv shell
python -m ipykernel install --user --name=per-diems # apparently needed for kernel to play nice with pipenv
jupyter lab analysis.ipynb
```
