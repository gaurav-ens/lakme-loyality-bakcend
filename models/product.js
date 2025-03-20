import Sequelize from "sequelize";
import sequelize from '../src/config/db.js';

export const product = sequelize.define("product", {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productName:{
        type:Sequelize.STRING(255),
    },
    productWeightage:{
       type:Sequelize.STRING(255),
    },
    store: {
      type: Sequelize.STRING(255),
      defaultValue: "lakme"
  },
    status:{
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
     }, source_of_device: {
        type: Sequelize.STRING(255),
        default : "lakme"
      },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: "updated_at",
        defaultValue: Sequelize.NOW,
      },
}); 
