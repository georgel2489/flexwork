const jwt = require("jsonwebtoken");
const authenticateToken = require("../../middleware/authenticateTokenMiddleware");

describe("authenticateToken Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      sendStatus: jest.fn(),
    };
    next = jest.fn();
  });

  test("should return 401 if no token is provided", () => {
    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 403 if token is invalid", () => {
    jwt.verify = jest.fn((token, secret, callback) => {
      callback(new Error("Invalid token"), null);
    });

    req.headers["authorization"] = "Bearer invalidtoken";

    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next if token is valid", () => {
    const user = { id: 1, name: "John Doe" };
    jwt.verify = jest.fn((token, secret, callback) => {
      callback(null, user);
    });

    req.headers["authorization"] = "Bearer validtoken";

    authenticateToken(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});
