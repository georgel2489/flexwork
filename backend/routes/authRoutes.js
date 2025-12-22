const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateTokenMiddleware");
const authorizeRole = require("../middleware/authorizeRoleMiddleware");

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/forget:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       404:
 *         description: User not found
 */
router.post("/forget", authController.forgetPassword);

/**
 * @swagger
 * /auth/resetpassword:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/resetpassword", authController.resetPassword);

/**
 * @swagger
 * /auth/changepassword:
 *   post:
 *     summary: Change password (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/changepassword",
  authenticateToken,
  authController.changePassword
);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   staff_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   dept:
 *                     type: string
 *                   position:
 *                     type: string
 *                   role_id:
 *                     type: integer
 *                   is_active:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  "/users",
  authenticateToken,
  authorizeRole([1]),
  authController.getAllUsers
);

/**
 * @swagger
 * /auth/createuser:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_fname
 *               - staff_lname
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               staff_fname:
 *                 type: string
 *                 example: John
 *               staff_lname:
 *                 type: string
 *                 example: Doe
 *               dept:
 *                 type: string
 *                 example: Engineering
 *               position:
 *                 type: string
 *                 example: Software Engineer
 *               country:
 *                 type: string
 *                 example: Singapore
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@company.com
 *               reporting_manager_id:
 *                 type: integer
 *                 example: 140002
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     dept:
 *                       type: string
 *                     position:
 *                       type: string
 *                     role:
 *                       type: integer
 *       400:
 *         description: User already exists or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  "/createuser",
  authenticateToken,
  authorizeRole([1]),
  authController.createUser
);

/**
 * @swagger
 * /auth/users/{userId}:
 *   put:
 *     summary: Update user information (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staff_fname:
 *                 type: string
 *               staff_lname:
 *                 type: string
 *               position:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.put(
  "/users/:userId",
  authenticateToken,
  authorizeRole([1]),
  authController.updateUser
);

module.exports = router;
