import { useState } from 'react';
import { useOrderNotes, useAddOrderNote } from '@/hooks/useOrderNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Loader2, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderNotesSectionProps {
  orderId: string;
}

export function OrderNotesSection({ orderId }: OrderNotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { data: notes, isLoading } = useOrderNotes(orderId);
  const addNote = useAddOrderNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await addNote.mutateAsync({
      orderId,
      noteContent: newNote,
    });
    
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          الملاحظات الداخلية
        </h2>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة ملاحظة
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4 mb-4 bg-muted/50">
          <Textarea
            placeholder="اكتب ملاحظتك هنا..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNote('');
              }}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || addNote.isPending}
            >
              {addNote.isPending && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              حفظ الملاحظة
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-4 bg-card">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{note.user_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {note.user_role}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                </div>
              </div>
              <p className="text-sm pr-10">{note.note_content}</p>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          لا توجد ملاحظات داخلية بعد
        </p>
      )}
    </div>
  );
}
