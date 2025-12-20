const { Staff } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { JWT_SECRET } = process.env;
const { Op } = require("sequelize");
const mailService = require("./mailService"); // Import mail service

// Login Service
exports.login = async (email, password) => {
  const staff = await Staff.findOne({
    where: {
      email: {
        [Op.iLike]: email, // Case-insensitive match for PostgreSQL
      },
    },
  });
  if (!staff || !bcrypt.compareSync(password, staff.hashed_password)) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { staff_id: staff.staff_id, role: staff.role_id },
    JWT_SECRET,
    { expiresIn: "720h" }
  );
  return {
    token,
    user: {
      id: staff.staff_id,
      role: staff.role_id,
      name: `${staff.staff_fname} ${staff.staff_lname}`,
      dept: staff.dept,
      position: staff.position,
    },
  };
};

// Forget Password Service
exports.forgetPassword = async (email) => {
  // return { message: 'Password has been reset successfully' };
  const staff = await Staff.findOne({
    where: {
      email: {
        [Op.iLike]: email, // Case-insensitive match for PostgreSQL
      },
    },
  });
  if (!staff) {
    throw new Error("User not found");
  }

  // Generate a reset token
  const token = crypto.randomBytes(32).toString("hex");
  staff.resetToken = token;
  staff.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
  await staff.save();
  // Call mail service to send the reset password email
  await mailService.sendResetPasswordEmail(email, token);

  return {
    email: staff.email,
    token,
    reset_url: `/auth/reset-password?token=${token}`,
  }; // Optionally return the token (but generally not needed)
};

// Reset Password Service
exports.resetPassword = async (token, newPassword) => {
  const staff = await Staff.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: Date.now() }, // Ensure token is not expired
    },
  });

  if (!staff) {
    throw new Error("Token is invalid or has expired");
  }

  // Hash the new password and save it
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  staff.hashed_password = hashedPassword;
  staff.resetToken = null; // Clear the token
  staff.resetTokenExpiry = null; // Clear the expiry time
  await staff.save();

  return { message: "Password has been reset successfully" };
};

// Change Password Service
exports.changePassword = async (staffId, currentPassword, newPassword) => {
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new Error("Token is invalid or has expired");
  }

  if (!bcrypt.compareSync(currentPassword, staff.hashed_password)) {
    throw new Error("Current password is incorrect");
  }

  // Hash the new password and save it
  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
  staff.hashed_password = hashedNewPassword;
  await staff.save();

  return { message: "Password changed successfully" };
};

// Get All Users Service
exports.getAllUsers = async () => {
  const users = await Staff.findAll({
    attributes: [
      'staff_id',
      'staff_fname',
      'staff_lname',
      'dept',
      'position',
      'country',
      'email',
      'reporting_manager_id',
      'role_id',
      'is_active',
      'created_at',
    ],
    order: [['staff_id', 'ASC']],
  });

  return users.map(user => ({
    id: user.staff_id,
    staff_id: user.staff_id,
    name: `${user.staff_fname} ${user.staff_lname}`,
    first_name: user.staff_fname,
    last_name: user.staff_lname,
    email: user.email,
    dept: user.dept,
    position: user.position,
    country: user.country,
    reporting_manager_id: user.reporting_manager_id,
    role_id: user.role_id,
    is_active: user.is_active,
    created_at: user.created_at,
  }));
};

// Create User Service
exports.createUser = async (userData) => {
  const {
    staff_fname,
    staff_lname,
    dept,
    position,
    country,
    email,
    reporting_manager_id,
    password,
    role_id,
    is_active = true,
  } = userData;

  const existingStaff = await Staff.findOne({
    where: {
      email: { [Op.iLike]: email }
    },
  });

  if (existingStaff) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newStaff = await Staff.create({
    staff_fname,
    staff_lname,
    dept,
    position,
    country,
    email,
    reporting_manager_id,
    hashed_password: hashedPassword,
    role_id,
    is_active,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return {
    message: "User created successfully",
    user: {
      id: newStaff.staff_id,
      email: newStaff.email,
      name: `${newStaff.staff_fname} ${newStaff.staff_lname}`,
      dept: newStaff.dept,
      position: newStaff.position,
      role: newStaff.role_id,
    },
  };
};
