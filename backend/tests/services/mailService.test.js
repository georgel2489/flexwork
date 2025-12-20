const formData = require("form-data");
const Mailgun = require("mailgun.js");

jest.mock("mailgun.js", () => {
  return jest.fn().mockImplementation(() => {
    return {
      client: jest.fn(() => {
        return {
          messages: {
            create: jest.fn(),
          },
        };
      }),
    };
  });
});

const mailService = require("../../services/mailService");

describe("sendResetPasswordEmail", () => {
  let mg;
  let email;
  let token;
  let mockCreate;

  beforeAll(() => {
    email = "test@example.com";
    token = "test-token";
    mg = new Mailgun(formData).client({ key: process.env.MAILGUN_API_KEY });
    mockCreate = mg.messages.create;

    process.env.FRONTEND_URL = "http://localhost:3000";
    process.env.MAILGUN_API_KEY = "test-key";
  });

  it("should send a reset password email with correct parameters", async () => {
    const expectedResetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const expectedEmailParams = {
      from: "AllinOne WFH System <mailgun@sandbox4bdbbd09b21542d1a41ef3ab735ddbd1.mailgun.org>",
      to: "julian.maximal@gmail.com",
      subject: "Password Reset",
      html: expect.stringContaining(expectedResetLink),
    };

    await mailService.sendResetPasswordEmail(email, token);
  });
});
