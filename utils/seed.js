require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Item = require("../models/Item");
const Group = require("../models/Group"); // ✅ Import Group model
const bcrypt = require("bcryptjs");

async function seed(action) {
  await connectDB(process.env.MONGO_URI);

  if (action === "delete") {
    await User.deleteMany({});
    await Item.deleteMany({});
    await Group.deleteMany({});
    console.log("🔥 All users, items, and groups deleted");
    process.exit(0);
  }

  if (action === "insert") {
    await User.deleteMany({});
    await Item.deleteMany({});
    await Group.deleteMany({});

    // 🔑 Passwords
    const adminPass = await bcrypt.hash("admin123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    // 👤 Users
    const admin = await User.create({
      username: "admin",
      password: adminPass,
      role: "admin",
    });
    const user = await User.create({
      username: "user",
      password: userPass,
      role: "user",
    });

    // 📦 Groups
    const electronics = await Group.create({
      name: "Electronics",
      description: "Electronic gadgets and accessories",
    });
    const office = await Group.create({
      name: "Office Supplies",
      description: "Everyday office essentials",
    });

    // 📦 Items with groups
    await Item.create([
      {
        name: "AA Batteries",
        sku: "BAT-AA",
        quantity: 200,
        price: 0.5,
        createdBy: admin._id,
        group: office._id, // 🔗 assigned to Office
      },
      {
        name: "USB-C Cable",
        sku: "USB-C-1M",
        quantity: 50,
        price: 3.99,
        createdBy: user._id,
        group: electronics._id, // 🔗 assigned to Electronics
      },
      {
        name: "Laptop Stand",
        sku: "STAND-01",
        quantity: 12,
        price: 29.99,
        createdBy: admin._id,
        group: office._id, // 🔗 assigned to Office
      },
    ]);

    console.log(
      "✅ Seed done.\n" +
        "👤 Credentials:\n - Admin: admin/admin123\n - User: user/user123\n" +
        "📦 Groups created: Electronics, Office Supplies"
    );
    process.exit(0);
  }

  console.log("❌ Please specify action: 'insert' or 'delete'");
  process.exit(1);
}

const action = process.argv[2]; // get arg from command line
seed(action).catch((err) => {
  console.error(err);
  process.exit(1);
});
