import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import type { MeetupWithCreator } from "@shared/schema";

interface MeetupCardProps {
  meetup: MeetupWithCreator;
  showJoinButton?: boolean;
}

export default function MeetupCard({ meetup, showJoinButton = false }: MeetupCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'full':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetupTypeDisplay = (type: string) => {
    switch (type) {
      case '1v1':
        return '1-on-1';
      case '3people':
        return '3 People';
      case 'group':
        return 'Group';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{meetup.title}</h4>
            <p className="text-sm text-gray-600 mb-2">
              with {meetup.creator.firstName} {meetup.creator.lastName}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(meetup.scheduledDate)}
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {meetup.scheduledTime || 'Time TBD'}
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {getMeetupTypeDisplay(meetup.meetupType)}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(meetup.status)}`}>
                {meetup.status}
              </Badge>
            </div>

            {meetup.restaurantName && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                {meetup.restaurantName}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2">
            <span className="text-xs text-gray-500">
              {meetup.currentParticipants}/{meetup.maxParticipants} joined
            </span>
            
            {showJoinButton ? (
              <Button size="sm" variant="outline">
                Join
              </Button>
            ) : (
              <Link href={`/chat/${meetup.id}`}>
                <Button size="sm" variant="outline">
                  Chat
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
