#!/bin/bash

pipenv install
pipenv shell
python -m ipykernel install --user --name=per-diems
