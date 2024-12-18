# nasa-project-api

NASA Mission Control API

This is a personal project that follows @ZTM node course.

I'll explore API server architecture, best practices and rest conventions.

The base tech stack is node + express.

## Configuration

The server will run by default on port `8000`, but you can specify a different one by passing the PORT env variable i.e.: `PORT=5000`

By default the API will allow cross origin request from `http://localhost:3000`

## Data

This app requires nasa data to be place in the root of the project in a `data` folder: `/data`
The data format should be `csv`, and you can get it from this url: `https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative`

## Architecture Layout

![architecture](https://github.com/hernorusso/nasa-project-api/blob/main/architecture.png?raw=true)
