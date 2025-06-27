import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Send, Info, Paperclip, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import ChatPinnedHeader from "@/components/ChatPinnedHeader";
import type { ChatMessageWithUser, MeetupWithParticipants } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute('/chat/:id?');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's current active match
  const { data: userMatches = [] } = useQuery({
    queryKey: ['/api/user/matches'],
  });

  const matches = Array.isArray(userMatches) ? userMatches : [];
  const currentMatch = matches[0]; // Only one active match
  const matchId = params?.id ? parseInt(params.id) : currentMatch?.id;

  const { data: match } = useQuery({
    queryKey: ['/api/matches', matchId],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    },
    enabled: !!matchId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/matches', matchId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<ChatMessageWithUser[]>;
    },
    enabled: !!matchId,
  });

  // If no active match, show no match message
  if (!matchId && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Chat</h1>
        </header>
        
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No active matches yet</p>
            <Link to="/">
              <Button>Find a Match</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // WebSocket setup
  useEffect(() => {
    if (!matchId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join_room',
        matchId,
      }));
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message' || data.type === 'message_sent') {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/matches', matchId, 'messages'] 
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [matchId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket || !user) return;

    socket.send(JSON.stringify({
      type: 'chat_message',
      matchId,
      userId: (user as any).id,
      message: message.trim(),
    }));

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return firstName?.[0] || lastName?.[0] || '?';
  };

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Link href="/matches">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {match.meetupType === '1v1' ? '1-on-1 Chat' : 'Group Chat'}
            </h2>
            <p className="text-sm text-gray-600">
              {match.meetupType === '1v1' ? (
                match.sharedInterest ? 
                  `💭 ${match.sharedInterest}` : 
                  'Let\'s get to know each other!'
              ) : (
                `${match.users.length} participants • Anonymous chat`
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
            <Info className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </header>

      {/* Participants Bar */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {match.meetupType === 'group' ? (
            // Anonymous participants for group chats
            match.users.map((matchUser: any, index: number) => (
              <div key={matchUser.id} className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    A{index + 1}
                  </span>
                </div>
                <span className="text-xs text-gray-600">Anonymous {index + 1}</span>
              </div>
            ))
          ) : (
            // Show "You + 1 other" for 1v1 chats
            <span className="text-xs text-gray-600">You + 1 other person</span>
          )}
        </div>
      </div>

      {/* Pinned Meetup Details Header */}
      <ChatPinnedHeader
        matchId={matchId}
        venueType={match.venueType}
        canEdit={true}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500 text-center">
              No messages yet. Be the first to say hello! 👋
            </p>
          </div>
        ) : (
          (() => {
            // For group chats: Create anonymous mapping for users
            // For 1v1 chats: Show "You" and "Other person"
            if (match.meetupType === 'group') {
              const userAnonymousMap = new Map<number, number>();
              let anonymousCounter = 1;
              
              // First pass: assign anonymous numbers
              messages.forEach(msg => {
                if (!userAnonymousMap.has(msg.user.id)) {
                  userAnonymousMap.set(msg.user.id, anonymousCounter++);
                }
              });

              return messages.map((msg, index) => {
                const anonymousNumber = userAnonymousMap.get(msg.user.id);
                const anonymousName = `Anonymous ${anonymousNumber}`;
                const anonymousInitials = `A${anonymousNumber}`;
                
                const showDateSeparator = index === 0 || 
                  new Date(msg.createdAt || '').toDateString() !== new Date(messages[index - 1].createdAt || '').toDateString();

                return (
                  <div key={msg.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {new Date(msg.createdAt || '').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}

                    {/* Discord-style Anonymous Message */}
                    <div className="group flex items-start space-x-3 px-4 py-1 hover:bg-gray-50 rounded">
                      {/* Anonymous Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold">
                            {anonymousInitials}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {/* Anonymous Username */}
                          <span className="font-semibold text-gray-900 text-sm">
                            {anonymousName}
                          </span>

                          {/* Timestamp */}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt || '').toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>

                        {/* Message Text */}
                        <div className="mt-1">
                          <p className="text-gray-900 text-sm leading-relaxed break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            } else {
              // 1v1 Chat: Show "You" and "Other person"
              return messages.map((msg, index) => {
                const isCurrentUser = user && msg.user.id === (user as any).id;
                const displayName = isCurrentUser ? 'You' : 'Other person';
                const initials = isCurrentUser ? 'Y' : 'O';
                
                const showDateSeparator = index === 0 || 
                  new Date(msg.createdAt || '').toDateString() !== new Date(messages[index - 1].createdAt || '').toDateString();

                return (
                  <div key={msg.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {new Date(msg.createdAt || '').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}

                    {/* Discord-style Message */}
                    <div className="group flex items-start space-x-3 px-4 py-1 hover:bg-gray-50 rounded">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`text-white text-sm font-semibold ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                              : 'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {/* Username */}
                          <span className="font-semibold text-gray-900 text-sm">
                            {displayName}
                          </span>

                          {/* Timestamp */}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt || '').toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>

                        {/* Message Text */}
                        <div className="mt-1">
                          <p className="text-gray-900 text-sm leading-relaxed break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            }
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 rounded-full focus:ring-2 focus:ring-primary focus:bg-white border-0"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || !socket}
            className="p-3 gradient-primary text-white rounded-full hover:shadow-lg transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
