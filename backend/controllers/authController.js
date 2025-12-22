const authService = require("../services/authService");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await authService.forgetPassword(email);
    return res.status(200).json({
      message: "Password reset link sent to your email",
      reset_url: result.reset_url,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const result = await authService.resetPassword(token, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const staffId = req.user.staff_id;

  try {
    const result = await authService.changePassword(
      staffId,
      currentPassword,
      newPassword
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await authService.getAllUsers(page, limit);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const result = await authService.createUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await authService.updateUser(userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
