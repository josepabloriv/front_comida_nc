import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { useDebounce } from '../hooks/useDebounce';
import Card, { CardBody } from '../components/ui/Card';
import Input from '../components/ui/Input';
import EmptyState from '../components/shared/EmptyState';

export default function StudentsListPage() {
  const [search, setSearch] = useState('');
  const [grado, setGrado] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const debouncedGrado = useDebounce(grado, 300);
  const { data: students, isLoading } = useStudents({ search: debouncedSearch, grado: debouncedGrado });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Estudiantes</h1>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, apellidos o grado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                placeholder="Filtrar por grado"
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : students && students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link key={student.student_id || student.id} to={`/estudiantes/${student.student_id || student.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <i className="bi bi-person text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {student.nombre} {student.apellidos}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        <i className="bi bi-mortarboard mr-1" />
                        {student.grado}
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-slate-400 shrink-0" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon="bi-search"
              title="No se encontraron estudiantes"
              description={search || grado ? 'Intenta con otros términos de búsqueda' : 'Aún no hay estudiantes registrados'}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
