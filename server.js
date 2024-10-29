const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: 'GET, POST', 
  allowedHeaders: 'Content-Type, Authorization', 
}));

const db = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.getConnection() 
  .then(() => console.log('Conectado a la base de datos MySQL'))
  .catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1); // Exit on connection error
  });

app.get('/sales/:type', async (req, res) => {
  const { type } = req.params;

  try {
    let query;
    switch (type) {
      case 'by-employee':
        query = 'SELECT employee_id, name, COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales GROUP BY employee_id';
        break;
      case 'by-room-type':
        query = 'SELECT room_type, COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales GROUP BY room_type';
        break;
      case 'by-channel':
        query = 'SELECT sales_channel, COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales GROUP BY sales_channel';
        break;
      case 'by-month':
        query = 'SELECT MONTH(sale_date) as month, SUM(amount) as total_sales FROM sales GROUP BY MONTH(sale_date)';
        break;
      case 'by-country':
        query = 'SELECT country, COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales GROUP BY country';
        break;
      case 'by-hotel-brand':
        query = 'SELECT hotel_brand, COUNT(*) as total_sales, SUM(amount) as total_revenue FROM sales GROUP BY hotel_brand';
        break;
      case 'by-rewards':
        query = 'SELECT customer_id, SUM(rewards_points) as total_rewards FROM sales GROUP BY customer_id';
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte inválido' });
    }

    const [results] = await db.query(query);
    if (results.length === 0 && type === 'by-rewards') {
      return res.status(404).json({ message: 'No rewards found' });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
