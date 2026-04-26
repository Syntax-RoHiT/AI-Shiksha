import React from 'react';
import { CertificateElement, PLACEHOLDERS, FONTS } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Type,
    Image as ImageIcon,
    Move,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
    Plus,
    Palette,
    QrCode,
    CaseUpper,
    CaseLower,
    CaseSensitive
} from 'lucide-react';

interface CertificateToolbarProps {
    selectedElement: CertificateElement | null;
    onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
    onAddText: (text: string) => void;
    onAddImage: (file: File) => void;
    onAddQrCode: () => void;
    onDeleteElement: (id: string) => void;
    onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveBackground: () => void;
    canvasBackgroundColor: string;
    onUpdateCanvasBackground: (color: string) => void;
}

export function CertificateToolbar({
    selectedElement,
    onUpdateElement,
    onAddText,
    onAddImage,
    onAddQrCode,
    onDeleteElement,
    onUploadBackground,
    onRemoveBackground,
    canvasBackgroundColor,
    onUpdateCanvasBackground,
}: CertificateToolbarProps) {

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAddImage(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l w-full md:w-80 shadow-lg overflow-y-auto border-t md:border-t-0">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Builder Tools</h3>
            </div>

            <Tabs defaultValue="add" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 p-2">
                    <TabsTrigger value="add">Add</TabsTrigger>
                    <TabsTrigger value="style" disabled={!selectedElement}>Style</TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Background Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Background</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <Label htmlFor="bg-upload" className="cursor-pointer">
                                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                            <ImageIcon className="h-6 w-6" />
                                            <span className="text-xs">Upload Background</span>
                                        </div>
                                    </div>
                                    <input
                                        id="bg-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onUploadBackground}
                                    />
                                </Label>
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                                <Label className="text-xs">Color:</Label>
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        type="color"
                                        value={canvasBackgroundColor}
                                        onChange={(e) => onUpdateCanvasBackground(e.target.value)}
                                        className="h-8 w-full p-1 cursor-pointer"
                                    />
                                    <Button variant="outline" size="icon" onClick={onRemoveBackground} title="Clear Background Image">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr />

                    {/* Add Elements Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Add Elements</Label>
                        <div className="space-y-2">
                            <Button className="w-full justify-start" onClick={() => onAddText("Double click to edit")}>
                                <Type className="mr-2 h-4 w-4" />
                                Add Text Box
                            </Button>

                            <Label htmlFor="img-elem-upload" className="w-full">
                                <div className="flex items-center justify-start w-full px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Add Image / Logo
                                </div>
                                <input
                                    id="img-elem-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </Label>

                            <Button className="w-full justify-start" variant="outline" onClick={onAddQrCode}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Add QR Code
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Variable
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-56 p-2">
                                    <div className="grid gap-1">
                                        {PLACEHOLDERS.map((p) => (
                                            <Button
                                                key={p.value}
                                                variant="ghost"
                                                className="justify-start h-8 text-sm"
                                                onClick={() => onAddText(p.value)}
                                            >
                                                {p.label}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="style" className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {selectedElement && (
                        <>
                            {/* Content Editor */}
                            {(selectedElement.type === 'text' || selectedElement.type === 'variable') && (
                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <Input
                                        value={selectedElement.content}
                                        onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Dimensions (for Image/QRCode) */}
                            {(selectedElement.type === 'image' || selectedElement.type === 'qrcode') && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Dimensions</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Width</Label>
                                            <Input
                                                type="number"
                                                value={Math.round(selectedElement.width || 100)}
                                                onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Height</Label>
                                            <Input
                                                type="number"
                                                value={Math.round(selectedElement.height || 100)}
                                                onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Typography - Only for Text/Variables */}
                            {(selectedElement.type === 'text' || selectedElement.type === 'variable') && (
                                <div className="space-y-4">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Typography</Label>

                                    <Select
                                        value={selectedElement.style.fontFamily}
                                        onValueChange={(val) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontFamily: val } })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Font" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FONTS.map(f => (
                                                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                value={selectedElement.style.fontSize}
                                                onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })}
                                                min={8}
                                                max={200}
                                            />
                                        </div>
                                        <Input
                                            type="color"
                                            value={selectedElement.style.color}
                                            onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })}
                                            className="w-12 p-1 cursor-pointer"
                                        />
                                    </div>

                                    {/* Style Toggles */}
                                    <div className="flex gap-1 justify-between bg-muted p-1 rounded-md">
                                        <Button
                                            variant={selectedElement.style.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                                        >
                                            <Bold className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={selectedElement.style.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                                        >
                                            <Italic className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px bg-border mx-1" />
                                        <Button
                                            variant={selectedElement.style.textAlign === 'left' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'left' } })}
                                        >
                                            <AlignLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={selectedElement.style.textAlign === 'center' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'center' } })}
                                        >
                                            <AlignCenter className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={selectedElement.style.textAlign === 'right' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: 'right' } })}
                                        >
                                            <AlignRight className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Text Transform */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px]">Text Transform</Label>
                                        <ToggleGroup
                                            type="single"
                                            value={selectedElement.style.textTransform || 'none'}
                                            onValueChange={(val) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, textTransform: val as any } })}
                                            className="justify-start"
                                        >
                                            <ToggleGroupItem value="uppercase" aria-label="Uppercase"><CaseUpper className="h-4 w-4" /></ToggleGroupItem>
                                            <ToggleGroupItem value="lowercase" aria-label="Lowercase"><CaseLower className="h-4 w-4" /></ToggleGroupItem>
                                            <ToggleGroupItem value="capitalize" aria-label="Capitalize"><CaseSensitive className="h-4 w-4" /></ToggleGroupItem>
                                            <ToggleGroupItem value="none" aria-label="None"><span className="text-xs">None</span></ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>

                                    {/* Letter Spacing & Opacity */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <Label className="text-[10px]">Letter Spacing</Label>
                                                <span className="text-[10px] text-muted-foreground">{selectedElement.style.letterSpacing || 0}px</span>
                                            </div>
                                            <Slider
                                                value={[selectedElement.style.letterSpacing || 0]}
                                                min={-2}
                                                max={20}
                                                step={0.5}
                                                onValueChange={([val]) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, letterSpacing: val } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <Label className="text-[10px]">Opacity</Label>
                                                <span className="text-[10px] text-muted-foreground">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
                                            </div>
                                            <Slider
                                                value={[selectedElement.style.opacity || 1]}
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                onValueChange={([val]) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, opacity: val } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Opacity for non-text elements too */}
                            {!(selectedElement.type === 'text' || selectedElement.type === 'variable') && (
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <Label className="text-[10px]">Opacity</Label>
                                        <span className="text-[10px] text-muted-foreground">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
                                    </div>
                                    <Slider
                                        value={[selectedElement.style.opacity || 1]}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        onValueChange={([val]) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, opacity: val } })}
                                    />
                                </div>
                            )}

                            {/* Position & Layout */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Position</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">X</Label>
                                        <Input
                                            type="number"
                                            value={Math.round(selectedElement.x)}
                                            onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Y</Label>
                                        <Input
                                            type="number"
                                            value={Math.round(selectedElement.y)}
                                            onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full mt-4"
                                onClick={() => onDeleteElement(selectedElement.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Element
                            </Button>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
