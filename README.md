# Per diems analysis analysis

## Why did we do this?

Does the U.S. pay out way more in per diem rates than other countries and institutions? We sought to answer that question.

## Who did this?

This is a product of the Center for Public Integrity's data team. It was created by Chris Zubak-Skees.

## What's here?

* [Analysis](analysis.ipynb) — Descriptive analysis of the results.

## How did we do it?

The notebook was developed on MacOS 10.13.4 with `git`, `node`, `yarn`, `pipenv` and Python 3 installed. These instructions are specific to that environment, but should be adaptable to others:

```sh
git clone https://github.com/PublicI/per-diems.git
cd per-diems
yarn install
pipenv install
pipenv shell
python -m ipykernel install --user --name=per-diems
```
