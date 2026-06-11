import { useState } from 'react';
import { useContactSubmissions, useUpdateSubmission, ContactSubmission, SubmissionStatus } from '@/hooks/useContactSubmissions';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageCircle, 
  Package, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Phone,
  Mail,
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusLabels: Record<SubmissionStatus, string> = {
  new: 'جديد',
  in_progress: 'قيد المتابعة',
  closed: 'مغلق',
};

const statusIcons: Record<SubmissionStatus, React.ReactNode> = {
  new: <Clock className="w-4 h-4" />,
  in_progress: <Loader2 className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
};

const statusColors: Record<SubmissionStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
};

export default function ContactSubmissions() {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');

  const type = selectedTab === 'all' ? undefined : selectedTab as 'contact' | 'custom_order' | 'complaint';
  const { data: submissions, isLoading } = useContactSubmissions(type);
  const updateSubmission = useUpdateSubmission();

  const handleViewDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setInternalNotes(submission.internal_notes || '');
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (status: SubmissionStatus) => {
    if (!selectedSubmission) return;
    updateSubmission.mutate({ 
      id: selectedSubmission.id, 
      status,
      internal_notes: internalNotes 
    });
  };

  const handleSaveNotes = () => {
    if (!selectedSubmission) return;
    updateSubmission.mutate({ 
      id: selectedSubmission.id, 
      internal_notes: internalNotes 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact': return <MessageCircle className="w-4 h-4" />;
      case 'custom_order': return <Package className="w-4 h-4" />;
      case 'complaint': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contact': return 'تواصل';
      case 'custom_order': return 'طلب مخصص';
      case 'complaint': return 'شكوى';
      default: return type;
    }
  };

  // Count submissions by status for tabs
  const newCount = submissions?.filter(s => s.status === 'new').length || 0;
  const inProgressCount = submissions?.filter(s => s.status === 'in_progress').length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الرسائل والطلبات</h1>
          <p className="text-muted-foreground">إدارة رسائل العملاء والطلبات المخصصة والشكاوى</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الرسائل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{newCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500" />
                قيد المتابعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                مغلق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {submissions?.filter(s => s.status === 'closed').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="contact" className="gap-1">
              <MessageCircle className="w-4 h-4" />
              تواصل
            </TabsTrigger>
            <TabsTrigger value="custom_order" className="gap-1">
              <Package className="w-4 h-4" />
              طلبات مخصصة
            </TabsTrigger>
            <TabsTrigger value="complaint" className="gap-1">
              <AlertTriangle className="w-4 h-4" />
              شكاوى
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : submissions?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد رسائل</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النوع</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الجوال</TableHead>
                        <TableHead>الرسالة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions?.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(submission.submission_type)}
                              <span className="text-sm">{getTypeLabel(submission.submission_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{submission.customer_name}</TableCell>
                          <TableCell dir="ltr" className="text-right">{submission.phone}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{submission.message}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[submission.status]}>
                              {statusIcons[submission.status]}
                              <span className="mr-1">{statusLabels[submission.status]}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(submission.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(submission)}
                            >
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubmission && getTypeIcon(selectedSubmission.submission_type)}
              {selectedSubmission && getTypeLabel(selectedSubmission.submission_type)}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && format(new Date(selectedSubmission.created_at), 'dd MMMM yyyy, HH:mm', { locale: ar })}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedSubmission.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span dir="ltr">{selectedSubmission.phone}</span>
                </div>
                {selectedSubmission.email && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedSubmission.email}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">الرسالة</label>
                <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                <Select 
                  value={selectedSubmission.status} 
                  onValueChange={(value) => handleUpdateStatus(value as SubmissionStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="in_progress">قيد المتابعة</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">ملاحظات داخلية</label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  placeholder="أضف ملاحظات داخلية..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateSubmission.isPending}>
              {updateSubmission.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ الملاحظات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
