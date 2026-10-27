function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[property], {
      abortEarly: false,
      convert: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message)
      })
    }

    if (property === 'query') {
      // Express 5 exposes req.query through a prototype getter. Define an own
      // property so converted Joi values remain available to later handlers.
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      })
    } else {
      req[property] = value
    }
    next()
  }
}

module.exports = validate
