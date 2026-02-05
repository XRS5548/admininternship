'use client';

import { useEffect, useState } from 'react';
import { Domain } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import { ApiResponse } from '@/types/domain';
import Link from 'next/link';
import { DomainTable } from '@/wecomponents/domains-cards';

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    const filtered = domains.filter(domain =>
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.skills.some(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredDomains(filtered);
  }, [searchTerm, domains]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/domains');
      const result: ApiResponse<Domain[]> = await response.json();
      
      if (result.success && result.data) {
        setDomains(result.data);
        setFilteredDomains(result.data);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (deletedId: number) => {
    setDomains(prev => prev.filter(domain => domain.id !== deletedId));
    setFilteredDomains(prev => prev.filter(domain => domain.id !== deletedId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Domains</h1>
          <p className="text-muted-foreground mt-2">
            Browse through various domains and their associated skills
          </p>
        </div>
        
        <Link href={'/domains/create'}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search domains or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredDomains.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No domains found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'No domains match your search. Try a different search term.' 
                  : 'No domains have been created yet.'
                }
              </p>
              {!searchTerm && (
                <Link href={'/domains/create'}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Domain
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredDomains.length} of {domains.length} domains
            </div>
          </div>
          
          <DomainTable 
            domains={filteredDomains} 
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}