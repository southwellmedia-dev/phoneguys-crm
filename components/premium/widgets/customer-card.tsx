"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Star, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Edit, 
  Crown,
  Calendar,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  last_visit?: string;
  notes?: string;
  is_vip?: boolean;
  rating?: number;
}

export interface CustomerCardProps {
  customer: Customer;
  variant?: "default" | "elevated" | "glass" | "compact" | "navy" | "cyan" | "gradient" | "vip";
  showActions?: boolean;
  onCall?: () => void;
  onEmail?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function CustomerCard({
  customer,
  variant = "default",
  showActions = false,
  onCall,
  onEmail,
  onMessage,
  onEdit,
  className
}: CustomerCardProps) {
  const fullName = `${customer.first_name} ${customer.last_name}`;
  
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating}/5</span>
      </div>
    );
  };

  // Navy variant - Professional standout for order details
  if (variant === "navy") {
    return (
      <Card variant="solid" color="navy" className={cn("overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-white/10 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
                {customer.is_vip && (
                  <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full">
                    <Crown className="h-4 w-4 text-navy-900" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl text-white">{fullName}</CardTitle>
                  {customer.is_vip && (
                    <Badge variant="solid" color="amber">VIP</Badge>
                  )}
                </div>
                {customer.rating && (
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < customer.rating! ? "fill-amber-400 text-amber-400" : "text-white/30"
                        )}
                      />
                    ))}
                    <span className="text-sm text-white/80 ml-1">{customer.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Mail className="h-4 w-4 text-white/70" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Phone className="h-4 w-4 text-white/70" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-white/90">
                <MapPin className="h-4 w-4 text-white/70" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}
          </div>

          {/* Customer Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold text-white">
                <Calendar className="h-4 w-4 text-white/70" />
                {customer.total_orders || 0}
              </div>
              <p className="text-xs text-white/70">Total Orders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold text-white">
                <DollarSign className="h-4 w-4 text-white/70" />
                {customer.total_spent ? `${customer.total_spent.toFixed(0)}` : '0'}
              </div>
              <p className="text-xs text-white/70">Total Spent</p>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-white/80 italic">{customer.notes}</p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-4 border-t border-white/20">
              {onCall && customer.phone && (
                <Button variant="glass" size="sm" onClick={onCall} className="text-white border-white/20 hover:bg-white/10">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              )}
              {onEmail && customer.email && (
                <Button variant="glass" size="sm" onClick={onEmail} className="text-white border-white/20 hover:bg-white/10">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              )}
              {onMessage && customer.phone && (
                <Button variant="glass" size="sm" onClick={onMessage} className="text-white border-white/20 hover:bg-white/10">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Text
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="ml-auto border-white/30 text-white hover:bg-white/10">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // VIP variant - Solid cyan for high-priority customers  
  if (variant === "vip" || (variant === "cyan" && customer.is_vip)) {
    return (
      <Card variant="solid" color="cyan" className={cn("overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-white/20 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full">
                  <Crown className="h-4 w-4 text-cyan-900" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl text-white">{fullName}</CardTitle>
                  <Badge variant="solid" color="amber">VIP Customer</Badge>
                </div>
                {customer.rating && (
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3 fill-amber-400 text-amber-400"
                        )}
                      />
                    ))}
                    <span className="text-sm text-white/90 ml-1 font-medium">Premium Customer</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/90 font-medium mb-2">Priority Customer Support</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{customer.total_orders || 0}</div>
                <div className="text-xs text-white/70">Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${customer.total_spent?.toFixed(0) || '0'}</div>
                <div className="text-xs text-white/70">Lifetime Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{customer.rating || 5}</div>
                <div className="text-xs text-white/70">Rating</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Glass variant - Modern premium feel
  if (variant === "glass") {
    return (
      <Card variant="glass" className={cn("overflow-hidden backdrop-blur-md", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-primary/30 to-primary/20 rounded-xl backdrop-blur-sm">
                  <User className="h-6 w-6 text-primary" />
                </div>
                {customer.is_vip && (
                  <div className="absolute -top-1 -right-1 p-1 bg-amber-400/90 backdrop-blur-sm rounded-full">
                    <Crown className="h-4 w-4 text-amber-900" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{fullName}</CardTitle>
                  {customer.is_vip && (
                    <Badge variant="soft" color="amber">VIP</Badge>
                  )}
                </div>
                {customer.rating && (
                  <div className="mt-1">
                    {renderStars(customer.rating)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Glassmorphism contact info */}
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats with glass effect */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 text-center">
              <div className="text-lg font-semibold">{customer.total_orders || 0}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 text-center">
              <div className="text-lg font-semibold">${customer.total_spent?.toFixed(0) || '0'}</div>
              <div className="text-xs text-muted-foreground">Spent</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            {customer.is_vip && (
              <div className="absolute -top-1 -right-1">
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{fullName}</h3>
              {customer.is_vip && (
                <Badge variant="soft" color="amber" size="sm">VIP</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {customer.rating && renderStars(customer.rating)}
              <span className="text-sm text-muted-foreground">
                {customer.total_orders || 0} orders
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default and other variants
  return (
    <Card variant={variant === "gradient" ? "gradient" : variant} className={cn("overflow-hidden", className)}>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <User className="h-6 w-6 text-primary" />
              </div>
              {customer.is_vip && (
                <div className="absolute -top-1 -right-1 p-1 bg-amber-100 rounded-full">
                  <Crown className="h-4 w-4 text-amber-600" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{fullName}</CardTitle>
                {customer.is_vip && (
                  <Badge variant="solid" color="amber">VIP</Badge>
                )}
              </div>
              {customer.rating && (
                <div className="mt-1">
                  {renderStars(customer.rating)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {customer.total_orders || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {customer.total_spent ? `${customer.total_spent.toFixed(0)}` : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground italic">{customer.notes}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t">
            {onCall && customer.phone && (
              <Button variant="outline" size="sm" onClick={onCall}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            {onEmail && customer.email && (
              <Button variant="outline" size="sm" onClick={onEmail}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}
            {onMessage && customer.phone && (
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Text
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="ml-auto">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}