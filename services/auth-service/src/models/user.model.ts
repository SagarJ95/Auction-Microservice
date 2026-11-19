import {
  DataTypes,
  Model,
  Optional
} from "sequelize";

import { sequelize } from "../config/database";

export enum UserRole {
  ADMIN = "ADMIN",
  SELLER = "SELLER",
  BIDDER = "BIDDER"
}

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "role"> {}

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {

  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.BIDDER
    }
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true
  }
);

export default User;