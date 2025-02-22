const request = require("supertest");

const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const app = require("../../app");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("It should respond with a 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Test POST /launch", () => {
    const completeLaunchData = {
      target: "Kepler-452 b",
      mission: "ZTM discovery 1",
      launchDate: "january 27, 2030",
      rocket: "ZTM Experimental IS1",
    };

    const launchDataWithoutDate = {
      target: "Kepler-452 b",
      mission: "ZTM discovery 1",
      rocket: "ZTM Experimental IS1",
    };

    const launchDataWithInvalidDate = {
      target: "Kepler-452 b",
      mission: "ZTM discovery 1",
      launchDate: "not a date",
      rocket: "ZTM Experimental IS1",
    };

    test("It should respond with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date("january 27, 2030").valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(requestDate).toBe(responseDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });
    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required mission property",
      });
    });

    test("It should catch invalid launch dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({ error: "Invalid launch date" });
    });
  });
});
