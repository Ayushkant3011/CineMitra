const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const Movie = require("../repositories/movie.repository");
const Theatre = require("../repositories/theatre.repository");
const Screen = require("../repositories/screen.repository");
const Seat = require("../repositories/seat.repository");

const showService = require("../services/show.service");

const toMovie = (m) =>({
    id: m.id,
    title: m.title,
    description: m.description, 
    language: m.language,
    genre: m.genre,
    durationMinutes: m.duration_minutes,
    posterUrl: m.poster_url,
    releaseDate: m.release_date,
});

const parseId = (value) =>{
    const id = Number(value);
    if(!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Id Must be a positive Integer");

    return id;
}

const createMovie = asyncHandler(async(req,res) =>{
    try{
        const row = await Movie.createMovie(req.body);
        res.status(201).json({
            data: { movie: toMovie(row)}
        });
    }
    catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
});

const updateMovie = asyncHandler(async(req, res) => {
    try{
        const id = parseId(req.params.id);
        const row = await Movie.updateMovie(id, req.body);

        if(!row) throw new AppError(404, "MOVIE_NOT_FOUND", "Movie not found");

        res.status(200).json({
            data: { movie: toMovie(row) }
        });
    }catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
});

const createTheatre = asyncHandler(async(req,res) =>{
    try{
        const row = await Theatre.createTheatre(req.body);
        res.status(201).json({
            data : { theatre: row}
        });
    }catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
});

const createScreen = asyncHandler(async(req,res) =>{
    let row;
    try{
        row = await Screen.createScreen(req.body);
    }catch(err){
        if(err.code === "23503") throw new AppError(404, "THEATRE_NOT_FOUND", "Theatre not found");

        if(err.code === "23505") throw new AppError(409, "SCREEN_NAME_TAKEN", "A Screen with this name already exists in this theatre");

        throw err;
    }

    res.status(201).json({
        data : { screen : { id: row.id, theatreId: row.theatre_id, name: row.name } }
    });
});


const createSeats = asyncHandler(async (req,res) =>{
    const { screenId, rows } = req.body;

    const seats = rows.flatMap((r) =>
        Array.from({ length: r.seatCount }, (_, i) => ({
            rowLabel: r.rowLabel,
            seatNumber: i + 1,
            category: r.category,
        }))
    );

    let created;
    try{
        created = await Seat.createSeats(screenId, seats);
    }catch(err){
        if (err.code === "23503") throw new AppError(404, "SCREEN_NOT_FOUND", "Screen not found");

        if (err.code === "23505") throw new AppError(409, "SEATS_EXIST", "One or more of these seats already exist on this screen");

        throw err;
    }

    res.status(201).json({
        data : { screenId, created }
    });
});


const createShow = asyncHandler(async(req, res) =>{
    const { show, prices } = await showService.createShow(req.body);

    res.status(201).json({
        data:{
            show:{
                id: show.id,
                movieId: show.movie_id,
                screenId: show.screen_id,
                startTime: show.start_time,
                endTime: show.end_time,
                status: show.status,
                prices,
            },
        },
    });
});

module.exports = { createMovie, updateMovie, createTheatre, createScreen, createSeats, createShow };