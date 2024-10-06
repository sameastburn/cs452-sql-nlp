import { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Schema from "@/public/schema.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

type Row = (string | number | null | Uint8Array)[];

interface ComponentProps {
  generateSQLQuery: (userInput: string, strategy: string) => Promise<string | null>;
  executeSQLQuery: (query: string) => string | Row[] | null;
  getFriendlyResponse: (queryResult: string) => Promise<string>;
  events: Event[];
}

export default function Component({ generateSQLQuery, executeSQLQuery, getFriendlyResponse, events }: ComponentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I can help you generate SQL queries for your calendar events database. What would you like to know?", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('zero-shot');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage: Message = { id: messages.length + 1, text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');

      const sqlQuery = await generateSQLQuery(input, selectedStrategy);
      if (sqlQuery) {
        const aiMessage: Message = { id: messages.length + 2, text: `Generated SQL Query: ${sqlQuery}`, sender: 'ai' };
        setMessages(prevMessages => [...prevMessages, aiMessage]);

        const queryResult = executeSQLQuery(sqlQuery);

        if (typeof queryResult === 'string' && queryResult.startsWith('Error:')) {
          const aiErrorMessage: Message = { id: messages.length + 3, text: queryResult, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiErrorMessage]);
        } else if (Array.isArray(queryResult)) {
          const rawQueryResponse = JSON.stringify(queryResult);
          const aiMessageQueryResult: Message = { id: messages.length + 3, text: `Query Result: ${rawQueryResponse}`, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiMessageQueryResult]);

          const friendlyResponse = await getFriendlyResponse(rawQueryResponse);
          const aiMessageFriendly: Message = { id: messages.length + 4, text: friendlyResponse, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiMessageFriendly]);
        } else if (queryResult === null) {
          const aiNoResultMessage: Message = { id: messages.length + 3, text: 'No results found.', sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiNoResultMessage]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto p-4 gap-4">
      <Card className="flex flex-col h-full w-full md:w-1/2">
        <CardHeader className="bg-blue-600 text-primary-foreground">
          <CardTitle>AI SQL Generator</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col h-full min-h-0 p-4">
          <div className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow overflow-auto mb-4">
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

            <div className="mt-2 flex-shrink-0">
              <div className="mb-4">
                <Select onValueChange={(value) => setSelectedStrategy(value)} defaultValue="zero-shot">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zero-shot">Zero-Shot</SelectItem>
                    <SelectItem value="single-domain">Single-Domain</SelectItem>
                    <SelectItem value="cross-domain">Cross-Domain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSend} className="flex gap-2 w-full">
                <Input
                  type="text"
                  placeholder="Ask about your calendar events..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-600 text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Illustration</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <img src={Schema}></img>
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
