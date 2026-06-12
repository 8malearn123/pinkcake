import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MessageCircle, Send, Package, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContactForm } from './ContactForm';

type SubmissionType = 'contact' | 'custom_order' | 'complaint';

interface ContactOption {
  type: SubmissionType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const contactOptions: ContactOption[] = [
  {
    type: 'contact',
    title: 'تواصل معنا',
    description: 'استفسار أو اقتراح',
    icon: <Send className="w-5 h-5" />,
  },
  {
    type: 'custom_order',
    title: 'الطلبات المخصصة',
    description: 'طلب كيكة أو حلوى مخصصة',
    icon: <Package className="w-5 h-5" />,
  },
  {
    type: 'complaint',
    title: 'شكوى',
    description: 'أخبرنا بمشكلتك وسنعمل على حلها',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];

export function FloatingContactButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SubmissionType | null>(null);

  const handleOptionClick = (type: SubmissionType) => {
    setSelectedType(type);
    setMenuOpen(false);
    setFormOpen(true);
  };

  const selectedOption = contactOptions.find((o) => o.type === selectedType);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 end-6 z-50">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 end-0 bg-card border rounded-xl shadow-xl p-2 w-64 space-y-1"
            >
              {contactOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleOptionClick(option.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-start"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.title}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg gradient-pink hover:scale-105 transition-transform"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Contact Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedOption?.icon}
              {selectedOption?.title}
            </SheetTitle>
            <SheetDescription>
              {selectedOption?.description}
            </SheetDescription>
          </SheetHeader>
          
          {selectedType && (
            <ContactForm 
              submissionType={selectedType}
              onSuccess={() => setFormOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
