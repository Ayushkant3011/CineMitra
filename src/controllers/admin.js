const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Movie = require("../repositories/movie.repository");

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
    const row = await Movie.createMovie(req.body);
    res.status(201).json({
        data: { movie: toMovie(row)}
    });
});

const updateMovie = asyncHandler(async(req, res) => {
    const id = parseId(req.params.id);
    const row = await Movie.updateMovie(id, req.body);

    if(!row) throw new AppError(404, "MOVIE_NOT_FOUND", "Movie not found");

    res.status(200).json({
        data: { movie: toMovie(row) }
    });
});


module.exports = { createMovie, updateMovie };