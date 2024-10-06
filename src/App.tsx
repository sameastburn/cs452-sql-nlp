import './App.css';
import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';
import OpenAI from 'openai';
import Component from './ai-chatbot';

let db: Database | null = null;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

const sanitizeForJustSql = (response: string) => {
  const gptStartSqlMarker = "```sql";
  const gptEndSqlMarker = "```";

  let sqlQuery = response;

  if (sqlQuery.includes(gptStartSqlMarker)) {
    sqlQuery = sqlQuery.split(gptStartSqlMarker)[1];
  }

  if (sqlQuery.includes(gptEndSqlMarker)) {
    sqlQuery = sqlQuery.split(gptEndSqlMarker)[0];
  }

  return sqlQuery.trim();
};

const zeroShotPrompt = (userInput: string) => `Generate an SQL query for the following request: ${userInput}`;

const singleDomainPrompt = (userInput: string) => `
You are interacting with a database that manages calendar events, users, and tasks.
The database schema is as follows:
- Table user(id INTEGER, username TEXT, password TEXT)
- Table event(id INTEGER, title TEXT, datetime TEXT, userId INTEGER)
- Table task(id INTEGER, title TEXT, datetime TEXT, isCompleted BOOLEAN, userId INTEGER)
Generate an SQL query for the following request: ${userInput}
`;

const crossDomainPrompt = (userInput: string) => `
You are an advanced AI assistant capable of generating SQL queries across different domains, including but not limited to calendar events, users, tasks, and more complex relationships.
The database schema is:
- Table user(id INTEGER, username TEXT, password TEXT)
- Table event(id INTEGER, title TEXT, datetime TEXT, userId INTEGER)
- Table task(id INTEGER, title TEXT, datetime TEXT, isCompleted BOOLEAN, userId INTEGER)
Generate the most suitable SQL query for this request: ${userInput}
`;

const generateSQLQuery = async (userInput: string, strategy: string) => {
  let prompt = '';

  switch (strategy) {
    case 'single-domain':
      prompt = singleDomainPrompt(userInput);
      break;
    case 'cross-domain':
      prompt = crossDomainPrompt(userInput);
      break;
    case 'zero-shot':
    default:
      prompt = zeroShotPrompt(userInput);
      break;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    let sqlQuery = response.choices[0]?.message?.content.trim() || null;
    if (sqlQuery) {
      sqlQuery = sanitizeForJustSql(sqlQuery);
    }

    return sqlQuery;
  } catch (error) {
    console.error('Error generating SQL query:', error);
    return null;
  }
};

const executeSQLQuery = (query: string) => {
  try {
    if (db) {
      const result = db.exec(query);
      return result.length > 0 ? result[0].values : null;
    }
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return `Error: ${error.message}`;
  }
};

const getFriendlyResponse = async (queryResult: string, question: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: `The SQL query result is: ${queryResult}. Please return a concise, human-readable result.` },
      ],
      max_tokens: 50,
      temperature: 0.5,
    });
    return response.choices[0]?.message?.content.trim() || 'No results found.';
  } catch (error) {
    console.error('Error generating friendly response:', error);
    return 'Error generating friendly response.';
  }
};

export default function App() {
  const [initialized, setInitialized] = useState(false);

  const initializeDatabase = async () => {
    const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });

    db = new SQL.Database();

    const setupScript = `
      DROP TABLE IF EXISTS user;
      DROP TABLE IF EXISTS event;
      DROP TABLE IF EXISTS task;

      CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL);
      CREATE TABLE event (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, datetime TEXT NOT NULL, userId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES user(id));
      CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, datetime TEXT NOT NULL, isCompleted BOOLEAN NOT NULL DEFAULT 0, userId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES user(id));
    `;

    db.exec(setupScript);

    for (let i = 0; i < 10; i++) {
      db.run(`
        INSERT INTO user (username, password)
        VALUES ('${randomUsername()}', 'password_${getRandomInt(1, 100)}');
      `);
    }

    for (let i = 0; i < 5; i++) {
      const userId = getRandomInt(1, 10);
      db.run(`
        INSERT INTO event (title, datetime, userId)
        VALUES ('${randomTitle()}', '${randomDate()}', ${userId});
      `);
    }

    for (let i = 0; i < 5; i++) {
      const userId = getRandomInt(1, 10);
      db.run(`
        INSERT INTO task (title, datetime, isCompleted, userId)
        VALUES ('${randomTaskTitle()}', '${randomDate()}', ${getRandomInt(0, 1)}, ${userId});
      `);
    }

    setInitialized(true);
    console.log('Database initialized and random data inserted');
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <div>
      {initialized ? (
        <Component
          db={db}
          generateSQLQuery={generateSQLQuery}
          executeSQLQuery={executeSQLQuery}
          getFriendlyResponse={getFriendlyResponse}
        />
      ) : (
        <p>Initializing database...</p>
      )}
    </div>
  );
}
