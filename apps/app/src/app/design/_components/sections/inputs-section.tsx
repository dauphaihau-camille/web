import { Input } from '@shared/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@shared/components/ui/input-group';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@/shared/ui/label';

import { GallerySection } from '../section';

const INPUT_SIZES = ['xs', 'sm', 'default', 'lg'] as const;

export function InputsSection() {
  return (
    <GallerySection
      title="Inputs"
      description="Sizes, invalid state, group addon, textarea."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="gallery-email">Email</Label>
          <Input
            id="gallery-email"
            placeholder="member@example.com"
            defaultValue="member@example.com"
          />
          {INPUT_SIZES.map(size => (
            <Input key={size} size={size} placeholder={`size ${size}`} />
          ))}
          <Input aria-invalid placeholder="invalid" defaultValue="not-an-email" />
          <Input disabled placeholder="disabled" />
        </div>
        <div className="space-y-3">
          <InputGroup>
            <InputGroupAddon>camille.app/</InputGroupAddon>
            <InputGroupInput placeholder="workspace-slug" />
          </InputGroup>
          <Textarea placeholder="Write a description" rows={4} />
        </div>
      </div>
    </GallerySection>
  );
}
