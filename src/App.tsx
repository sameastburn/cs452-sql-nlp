import './App.css';
import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';
import Component from './ai-chatbot';

let db: Database | null = null;

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = () => {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const randomUsername = () => `user_${getRandomInt(1, 1000)}`;
const randomTitle = () => `Event ${getRandomInt(1, 100)}`;
const randomTaskTitle = () => `Task ${getRandomInt(1, 100)}`;

export default function App() {
  const [initialized, setInitialized] = useState(false);

  const initializeDatabase = async () => {
    const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });

    db = new SQL.Database();

    db.run(`
      DROP TABLE IF EXISTS user;
      DROP TABLE IF EXISTS event;
      DROP TABLE IF EXISTS task;
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS event (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        datetime TEXT NOT NULL,
        userId INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        datetime TEXT NOT NULL,
        isCompleted BOOLEAN NOT NULL DEFAULT 0,
        userId INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id)
      );
    `);

    for (let i = 0; i < 10; i++) {
      db.run(`
        INSERT INTO user (username, password)
        VALUES ('${randomUsername()}', 'password_${getRandomInt(1, 100)}');
      `);
    }

    for (let i = 0; i < 5; i++) {
      const userId = getRandomInt(1, 10); // Assumes there are 5 users inserted
      db.run(`
        INSERT INTO event (title, datetime, userId)
        VALUES ('${randomTitle()}', '${randomDate()}', ${userId});
      `);
    }

    for (let i = 0; i < 5; i++) {
      const userId = getRandomInt(1, 10); // Assumes there are 5 users inserted
      db.run(`
        INSERT INTO task (title, datetime, isCompleted, userId)
        VALUES ('${randomTaskTitle()}', '${randomDate()}', ${getRandomInt(0, 1)}, ${userId});
      `);
    }

    setInitialized(true);
    console.log('Database initialized, tables created, and random data inserted');
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <div>
      {initialized ? (
        <Component db={db} />
      ) : (
        <p>Initializing database with random data...</p>
      )}
    </div>
  );
}
