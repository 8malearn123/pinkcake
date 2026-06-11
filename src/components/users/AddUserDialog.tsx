import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Enums } from '@/integrations/supabase/types';
import { ROLE_LABELS } from '@/hooks/useUsers';
import { useBranches } from '@/hooks/useBranches';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Copy, CheckCheck } from 'lucide-react';

type AppRole = Enums<'app_role'>;

const formSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().optional(),
  roles: z.array(z.string()).default([]),
  branch_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const { data: branches } = useBranches();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      roles: [],
      branch_id: '',
    },
  });

  const showBranchSelector = selectedRoles.includes('branch') || selectedRoles.includes('driver');

  const createUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone || null,
          roles: selectedRoles,
          branch_id: showBranchSelector ? data.branch_id : null,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      
      return { ...result, email: data.email, password: data.password };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreatedUserCredentials({ email: data.email, password: data.password });
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء المستخدم بنجاح. يمكنك الآن مشاركة بيانات الدخول.',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء المستخدم',
        variant: 'destructive',
      });
    },
  });

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const onSubmit = (data: FormData) => {
    createUserMutation.mutate(data);
  };

  const handleCopy = async (field: 'email' | 'password') => {
    if (!createdUserCredentials) return;
    const value = field === 'email' ? createdUserCredentials.email : createdUserCredentials.password;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    form.reset();
    setSelectedRoles([]);
    setCreatedUserCredentials(null);
    setCopiedField(null);
    onOpenChange(false);
  };

  const allRoles: AppRole[] = ['admin', 'call_center', 'kitchen', 'branch', 'driver', 'customer_support', 'customer'];

  // Show credentials screen after successful creation
  if (createdUserCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCheck className="w-5 h-5" />
              تم إنشاء المستخدم بنجاح
            </DialogTitle>
            <DialogDescription>
              يمكنك الآن مشاركة بيانات الدخول التالية مع المستخدم الجديد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <div className="flex gap-2">
                <Input value={createdUserCredentials.email} readOnly dir="ltr" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy('email')}
                >
                  {copiedField === 'email' ? (
                    <CheckCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <div className="flex gap-2">
                <Input value={createdUserCredentials.password} readOnly dir="ltr" type="password" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy('password')}
                >
                  {copiedField === 'password' ? (
                    <CheckCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                ⚠️ تأكد من إرسال بيانات الدخول للمستخدم بشكل آمن. لن تتمكن من عرض كلمة المرور مرة أخرى.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleClose}>
              تم
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreatedUserCredentials(null);
                form.reset();
                setSelectedRoles([]);
              }}
            >
              إضافة مستخدم آخر
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المستخدم الجديد. سيتم إنشاء حساب وإرسال بيانات الدخول إليك.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل *</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل الاسم الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@domain.com"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="6 أحرف على الأقل"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    سيتم إرسال كلمة المرور للمستخدم بعد الإنشاء
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>الأدوار *</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {allRoles.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <span className="text-sm">{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </div>

            {showBranchSelector && branches && branches.length > 0 && (
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفرع المعين</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفرع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border shadow-md">
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createUserMutation.isPending || selectedRoles.length === 0}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء المستخدم'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
