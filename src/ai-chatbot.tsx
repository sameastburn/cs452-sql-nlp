import { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database } from 'sql.js';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface Event {
  id: number;
  title: string;
  date: string;
  userId: number;
}

interface ComponentProps {
  db: Database | null; 
}

export default function Component({ db }: ComponentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I can help you generate SQL queries for your calendar events database. What would you like to know?", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [events, setEvents] = useState<Event[]>([]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessage: Message = { id: messages.length + 1, text: input, sender: 'user' };
      setMessages([...messages, newMessage]);
      setInput('');

      setTimeout(() => {
        const aiResponse: Message = { id: messages.length + 2, text: "I've generated a SQL query based on your request. Here are the results.", sender: 'ai' };
        setMessages(prevMessages => [...prevMessages, aiResponse]);

        if (db) {
          const sqlQuery = "SELECT * FROM event"; 
          const result = db.exec(sqlQuery);
          const fetchedEvents: Event[] = result[0]?.values.map((row: any[]) => ({
            id: row[0],
            title: row[1],
            date: row[2],
            userId: row[3],
          })) || [];
          setEvents(fetchedEvents);
        }
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto p-4 gap-4">
      <Card className="w-full md:w-1/2 flex flex-col h-full">
        <CardHeader className="bg-blue-600 text-primary-foreground">
          <CardTitle>AI SQL Generator</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-4 flex flex-col">
          <ScrollArea className="flex-grow mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-2 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSend} className="flex gap-2">
            <Input type="text" placeholder="Ask about your calendar events..." value={input} onChange={(e) => setInput(e.target.value)} className="flex-grow" />
            <Button type="submit" className="bg-blue-600 text-white">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="w-full md:w-1/2 flex flex-col h-full gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Illustration</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-12 " />
          </CardContent>
        </Card>
        <Card className="flex-grow overflow-hidden">
          <CardHeader>
            <CardTitle>Event Data</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-24rem)] md:h-[calc(50vh-8rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.id}</TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>{event.userId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
