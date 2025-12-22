const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js");
const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(config[env]);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Staff = require("./staff")(sequelize, DataTypes);
db.RequestGroup = require("./requestGroup")(sequelize, DataTypes);
db.ArrangementRequest = require("./arrangementRequest")(sequelize, DataTypes);
db.Schedule = require("./schedule")(sequelize, DataTypes);
db.Notification = require("./notification")(sequelize, DataTypes);
db.OfficialHoliday = require("./officialHoliday")(sequelize, DataTypes);

db.Staff.hasMany(db.RequestGroup, { foreignKey: "staff_id" });
db.RequestGroup.belongsTo(db.Staff, { foreignKey: "staff_id" });

db.Staff.hasMany(db.Schedule, { foreignKey: "staff_id" });
db.Schedule.belongsTo(db.Staff, { foreignKey: "staff_id" });

db.ArrangementRequest.belongsTo(db.RequestGroup, {
  foreignKey: "request_group_id",
});
db.RequestGroup.hasMany(db.ArrangementRequest, {
  foreignKey: "request_group_id",
});

db.Schedule.belongsTo(db.ArrangementRequest, { foreignKey: "request_id" });
db.ArrangementRequest.hasMany(db.Schedule, { foreignKey: "request_id" });

db.Staff.hasMany(db.Notification, { foreignKey: "staff_id" });
db.Notification.belongsTo(db.Staff, { foreignKey: "staff_id" });

db.sequelize
  .sync({ force: false })
  .then(() => {})
  .catch((err) => {});

module.exports = db;
