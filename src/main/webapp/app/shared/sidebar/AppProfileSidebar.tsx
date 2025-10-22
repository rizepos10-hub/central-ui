import React from 'react';
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "app/config/store";
import { toast } from "react-toastify";
import { logout } from "app/shared/reducers/authentication";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeyRound, CreditCard, Settings2, LogOut } from 'lucide-react';

interface AppProfileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AppProfileSidebar = ({ isOpen, setIsOpen }: AppProfileSidebarProps) => {
  const navigate = useNavigate();
  const account = useAppSelector(state => state.authentication.account);
  const { firstName, lastName } = account;
  const dispatch = useAppDispatch();

  const handleSignOutImmediate = () => {
    setIsOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left">Profile</SheetTitle>
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground">Welcome</p>
            <p className="text-base font-semibold">{firstName} {lastName}</p>
          </div>
        </SheetHeader>

        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
            <KeyRound className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm">Change Password</span>
          </button>

          <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
            <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm">Subscription</span>
          </button>

          <button className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
            <Settings2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm">Preferences</span>
          </button>

          <button
            onClick={handleSignOutImmediate}
            className="w-full flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
          >
            <LogOut className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppProfileSidebar;
