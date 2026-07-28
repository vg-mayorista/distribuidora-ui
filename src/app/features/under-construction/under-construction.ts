import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './under-construction.html',
  styleUrl: './under-construction.css',
})
export class UnderConstructionComponent {
  @Input() pageName = 'Esta página';
}
